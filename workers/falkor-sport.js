// falkor-sport v1.0.0
// AFL data via Squiggle API (free)
// Racing data via TAB API
// Family tipping comp — stored in falkor-brain D1
// Callable as a tool by falkor-agent

const SQUIGGLE  = 'https://api.squiggle.com.au';
const TAB_BASE  = 'https://api.tab.com.au/v1/tab-info-service';
const UA        = 'FalkorBot/1.0 (paddy@luckdragon.io)';
const BRAIN_URL = 'https://asgard-brain.luckdragon.io';

// ── Helpers ──────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60',
    },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Pin',
  };
}

async function squiggle(query) {
  const url = `${SQUIGGLE}/?${query}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Squiggle ${res.status}`);
  return res.json();
}

async function brainQuery(sql, params, pin) {
  const res = await fetch(`${BRAIN_URL}/d1/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Pin': pin },
    body: JSON.stringify({ sql, params: params || [] }),
  });
  return res.json();
}

async function brainWrite(sql, params, pin) {
  const res = await fetch(`${BRAIN_URL}/d1/write`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Pin': pin },
    body: JSON.stringify({ sql, params: params || [] }),
  });
  return res.json();
}

// ── Init DB tables ────────────────────────────────────────────────

async function initDB(pin) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS sport_footy_tips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player TEXT NOT NULL,
      year INTEGER NOT NULL,
      round INTEGER NOT NULL,
      game_id TEXT NOT NULL,
      tip TEXT NOT NULL,
      correct INTEGER DEFAULT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS sport_racing_tips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player TEXT NOT NULL,
      date TEXT NOT NULL,
      race_id TEXT NOT NULL,
      race_name TEXT NOT NULL,
      selection TEXT NOT NULL,
      result TEXT DEFAULT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    )`,
    `CREATE INDEX IF NOT EXISTS idx_footy_tips_round ON sport_footy_tips(year, round)`,
    `CREATE INDEX IF NOT EXISTS idx_footy_tips_player ON sport_footy_tips(player)`,
    `CREATE INDEX IF NOT EXISTS idx_racing_tips_date ON sport_racing_tips(date)`,
  ];
  for (const sql of tables) {
    await brainWrite(sql, [], pin);
  }
  return { ok: true, message: 'DB initialised' };
}

// ── AFL: Current round ────────────────────────────────────────────

async function getAFLRound(year, round) {
  const query = round
    ? `q=games;year=${year};round=${round}`
    : `q=games;year=${year};complete=!100`;

  const data = await squiggle(query);
  const games = (data.games || []).sort((a, b) => new Date(a.date) - new Date(b.date));

  return games.map(g => ({
    id: g.id,
    round: g.round,
    home: g.hteam,
    homeScore: g.hscore,
    away: g.ateam,
    awayScore: g.ascore,
    winner: g.winner || null,
    complete: g.complete,
    date: g.date,
    venue: g.venue,
    status: g.complete === 100 ? 'final' : g.complete > 0 ? 'live' : 'upcoming',
  }));
}

// ── AFL: Ladder ───────────────────────────────────────────────────

async function getAFLLadder(year) {
  const data = await squiggle(`q=standings;year=${year}`);
  return (data.standings || []).map(t => ({
    rank: t.rank,
    team: t.name,
    wins: t.wins,
    losses: t.losses,
    draws: t.draws,
    points: t.pts,
    percentage: Math.round(t.percentage * 10) / 10,
  }));
}

// ── AFL: AI Tips for upcoming round ──────────────────────────────

async function getAFLTips(year, round, source) {
  const srcParam = source ? `;source=${source}` : ';source=1'; // default: Squiggle
  const data = await squiggle(`q=tips;year=${year};round=${round}${srcParam}`);
  return (data.tips || []).map(t => ({
    gameId: t.gameid,
    tip: t.tip,
    opponent: t.opponent,
    confidence: t.confidence,
    source: t.sourcename || source,
  }));
}

// ── AFL: All tips from multiple sources ──────────────────────────

async function getAFLAllTips(year, round) {
  // Sources: 1=Squiggle, 5=Punters, 8=Aggregate
  const sources = [1, 5, 8];
  const allTips = {};

  await Promise.allSettled(sources.map(async (src) => {
    try {
      const data = await squiggle(`q=tips;year=${year};round=${round};source=${src}`);
      for (const t of (data.tips || [])) {
        const key = t.gameid;
        if (!allTips[key]) allTips[key] = { gameId: key, opponent: t.opponent, tips: {} };
        allTips[key].tips[`src${src}`] = { tip: t.tip, confidence: t.confidence };
      }
    } catch {}
  }));

  return Object.values(allTips);
}

// ── AFL: Family comp ──────────────────────────────────────────────

async function submitFootyTip(player, year, round, gameId, tip, pin) {
  // Upsert
  await brainWrite(
    `INSERT INTO sport_footy_tips (player, year, round, game_id, tip)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(player, year, round, game_id) DO UPDATE SET tip = excluded.tip`,
    [player, year, round, gameId, tip],
    pin
  );
  return { ok: true, player, round, tip };
}

async function getFootyComp(year, round, pin) {
  const result = await brainQuery(
    `SELECT player, game_id, tip, correct FROM sport_footy_tips WHERE year=? AND round=? ORDER BY player`,
    [year, round],
    pin
  );
  const rows = result.results || result.data || [];

  // Group by player
  const players = {};
  for (const r of rows) {
    if (!players[r.player]) players[r.player] = { tips: [], correct: 0, total: 0 };
    players[r.player].tips.push({ gameId: r.game_id, tip: r.tip, correct: r.correct });
    if (r.correct !== null) {
      players[r.player].total++;
      if (r.correct) players[r.player].correct++;
    }
  }

  // Season totals
  const seasonResult = await brainQuery(
    `SELECT player, SUM(correct) as wins, COUNT(*) as total
     FROM sport_footy_tips WHERE year=? AND correct IS NOT NULL GROUP BY player ORDER BY wins DESC`,
    [year],
    pin
  );
  const season = (seasonResult.results || seasonResult.data || []).map(r => ({
    player: r.player,
    correct: r.wins || 0,
    total: r.total || 0,
    pct: r.total > 0 ? Math.round((r.wins / r.total) * 100) : 0,
  }));

  return { year, round, players, season };
}

async function scoreFootyTips(year, round, pin) {
  // Get completed games for this round
  const games = await getAFLRound(year, round);
  const finalGames = games.filter(g => g.status === 'final');

  let updated = 0;
  for (const g of finalGames) {
    if (!g.winner) continue;
    await brainWrite(
      `UPDATE sport_footy_tips SET correct = CASE WHEN tip = ? THEN 1 ELSE 0 END
       WHERE year=? AND round=? AND game_id=?`,
      [g.winner, year, round, String(g.id)],
      pin
    );
    updated++;
  }
  return { ok: true, gamesScored: updated };
}

// ── Racing: Next to jump ──────────────────────────────────────────

async function getRacingNextToJump() {
  try {
    const res = await fetch(
      `${TAB_BASE}/racing/next-to-jump/races?maxRaces=5&jurisdiction=VIC`,
      { headers: { 'User-Agent': UA } }
    );
    if (!res.ok) throw new Error(`TAB ${res.status}`);
    const data = await res.json();
    const races = (data.races || []).map(r => ({
      id: r.raceNumber,
      name: r.raceName,
      meeting: r.meetingName,
      type: r.raceType,
      startTime: r.raceStartTime,
      status: r.raceStatus,
    }));
    return { ok: true, races };
  } catch (e) {
    return { ok: false, error: e.message, races: [] };
  }
}

async function getRacingMeetings(date) {
  try {
    const d = date || new Date().toISOString().slice(0, 10);
    const res = await fetch(
      `${TAB_BASE}/racing/dates/${d}/meetings?jurisdiction=VIC`,
      { headers: { 'User-Agent': UA } }
    );
    if (!res.ok) throw new Error(`TAB ${res.status}`);
    const data = await res.json();
    return {
      ok: true,
      date: d,
      meetings: (data.meetings || []).map(m => ({
        id: m.meetingId,
        name: m.meetingName,
        type: m.raceType,
        location: m.location,
        races: m.races?.length || 0,
      })),
    };
  } catch (e) {
    return { ok: false, error: e.message, meetings: [] };
  }
}

// ── Racing: Family comp ───────────────────────────────────────────

async function submitRacingTip(player, date, raceId, raceName, selection, pin) {
  await brainWrite(
    `INSERT INTO sport_racing_tips (player, date, race_id, race_name, selection)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(player, date, race_id) DO UPDATE SET selection = excluded.selection`,
    [player, date, raceId, raceName, selection],
    pin
  );
  return { ok: true, player, raceName, selection };
}

async function getRacingComp(date, pin) {
  const d = date || new Date().toISOString().slice(0, 10);
  const result = await brainQuery(
    `SELECT player, race_name, selection, result FROM sport_racing_tips WHERE date=? ORDER BY player`,
    [d],
    pin
  );
  return { date: d, tips: result.results || result.data || [] };
}

// ── Summary for falkor-agent ──────────────────────────────────────

async function getSportSummary(year, round, pin) {
  const [ladder, games, nextRace] = await Promise.allSettled([
    getAFLLadder(year),
    getAFLRound(year, round),
    getRacingNextToJump(),
  ]);

  const top5 = ladder.status === 'fulfilled'
    ? ladder.value.slice(0, 5).map(t => `${t.rank}. ${t.team} (${t.wins}W-${t.losses}L ${t.points}pts)`).join(', ')
    : 'unavailable';

  const roundGames = games.status === 'fulfilled' ? games.value : [];
  // Auto-detect current round from games if not supplied
  const detectedRound = round || (roundGames.length > 0
    ? Math.min(...roundGames.map(g => g.round))
    : null);
  // For summary, only show games for the current/next round
  const currentRoundGames = detectedRound
    ? roundGames.filter(g => g.round === detectedRound)
    : roundGames.slice(0, 9);
  const finals   = currentRoundGames.filter(g => g.status === 'final');
  const upcoming = currentRoundGames.filter(g => g.status === 'upcoming');
  const live     = currentRoundGames.filter(g => g.status === 'live');

  const resultsText = finals.map(g => `${g.home} ${g.homeScore} def ${g.away} ${g.awayScore}`).join('; ') || 'none yet';
  const upcomingText = upcoming.map(g => `${g.home} v ${g.away}`).join(', ') || 'none';
  const liveText = live.map(g => `${g.home} ${g.homeScore} v ${g.away} ${g.awayScore} (live)`).join('; ') || '';

  const racingInfo = nextRace.status === 'fulfilled' && nextRace.value.ok
    ? nextRace.value.races.slice(0,2).map(r => `${r.meeting} R${r.id} ${r.startTime}`).join(', ')
    : 'TAB data unavailable';

  // Footy comp standings
  let compText = '';
  try {
    const comp = await getFootyComp(year, round, pin);
    if (comp.season.length > 0) {
      compText = '\nFamily tipping: ' + comp.season.map(p => `${p.player} ${p.correct}/${p.total}`).join(', ');
    }
  } catch {}

  return {
    year,
    round,
    summary: `AFL Round ${detectedRound || '?'} ${year} — Top 5: ${top5}. Results: ${resultsText}. ${liveText ? 'Live: ' + liveText + '. ' : ''}Upcoming: ${upcomingText}.${compText} Racing: ${racingInfo}.`,
    ladder: ladder.status === 'fulfilled' ? ladder.value : [],
    roundGames: roundGames,
    currentRound: detectedRound,
    racing: nextRace.status === 'fulfilled' ? nextRace.value : { ok: false },
  };
}

// ── Router ────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url  = new URL(request.url);
    const path = url.pathname;
    const pin  = request.headers.get('X-Pin') || url.searchParams.get('pin') || '';
    const validPin = env.SPORT_PIN || '535554';

    // CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    // Health (no auth)
    if (path === '/health') {
      return json({ status: 'ok', version: '1.0.0', worker: 'falkor-sport' });
    }

    // Auth
    if (pin !== validPin) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const year  = parseInt(url.searchParams.get('year')  || '2026');
    const round = parseInt(url.searchParams.get('round') || '0') || null;

    try {
      // ── AFL endpoints ──
      if (path === '/afl/ladder') {
        return json(await getAFLLadder(year));
      }

      if (path === '/afl/round') {
        return json(await getAFLRound(year, round));
      }

      if (path === '/afl/tips') {
        const source = url.searchParams.get('source');
        return json(await getAFLTips(year, round, source));
      }

      if (path === '/afl/all-tips') {
        return json(await getAFLAllTips(year, round));
      }

      // ── Family footy comp ──
      if (path === '/afl/comp' && request.method === 'GET') {
        return json(await getFootyComp(year, round, pin));
      }

      if (path === '/afl/comp/tip' && request.method === 'POST') {
        const body = await request.json();
        return json(await submitFootyTip(body.player, year, body.round || round, body.gameId, body.tip, pin));
      }

      if (path === '/afl/comp/score' && request.method === 'POST') {
        return json(await scoreFootyTips(year, round, pin));
      }

      // ── Racing endpoints ──
      if (path === '/racing/next') {
        return json(await getRacingNextToJump());
      }

      if (path === '/racing/meetings') {
        return json(await getRacingMeetings(url.searchParams.get('date')));
      }

      if (path === '/racing/comp' && request.method === 'GET') {
        return json(await getRacingComp(url.searchParams.get('date'), pin));
      }

      if (path === '/racing/comp/tip' && request.method === 'POST') {
        const body = await request.json();
        return json(await submitRacingTip(body.player, body.date, body.raceId, body.raceName, body.selection, pin));
      }

      // ── Summary (for falkor-agent context) ──
      if (path === '/summary') {
        return json(await getSportSummary(year, round, pin));
      }

      // ── DB init ──
      if (path === '/init' && request.method === 'POST') {
        return json(await initDB(pin));
      }

      return json({ error: 'Not found', path }, 404);

    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};

     