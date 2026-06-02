-- =============================================================================
-- Site Maturity Dashboard — Schema
-- =============================================================================
-- For the Paddington Robotics prototype.
-- Reference date for all "days deployed" / "days in phase" calculations:
--   2026-06-02 (treated as hardcoded constant in app code, not stored here).
--
-- Seven tables:
--   1. sites               — customer site registry
--   2. robots              — per-robot data, FK to sites
--   3. shifts              — one row per shift (4am, morning, etc.)
--   4. incidents           — technical issues only
--   5. customer_concerns   — raised by human stakeholders, separate workflow
--   6. phase_transitions   — timeline of phase moves per site
--   7. phase_blockers      — what's stopping non-Phase-4 sites from progressing
--
-- Phase progression criteria (illustrative thresholds, see README):
--   Phase 2: 30+ days operating · autonomy ≥0.80 · no unresolved customer concerns
--   Phase 3: 60+ days in Phase 2 · autonomy ≥0.90 · ≥50% incidents resolved remotely
--   Phase 4: 90+ days in Phase 3 · autonomy ≥0.95 · no critical incidents in 30 days
-- =============================================================================

PRAGMA foreign_keys = ON;

-- -----------------------------------------------------------------------------
-- 1. sites
-- -----------------------------------------------------------------------------
CREATE TABLE sites (
    site_id                 INTEGER PRIMARY KEY,
    customer_name           TEXT    NOT NULL,                                                   -- e.g. "Tesco"
    store_format            TEXT    NOT NULL,                                                   -- "Express" / "Local" / "Metro" / "Superstore" / "Central" / "Food"
    site_name               TEXT    NOT NULL UNIQUE,                                            -- e.g. "Tesco Express Hammersmith"
    city                    TEXT    NOT NULL,
    area                    TEXT    NOT NULL,
    deployment_date         TEXT    NOT NULL,                                                   -- ISO date
    current_phase           INTEGER NOT NULL CHECK (current_phase IN (1, 2, 3, 4)),             -- stored, kept in sync via app
    operating_hours_per_day INTEGER NOT NULL CHECK (operating_hours_per_day BETWEEN 0 AND 24)
);

-- -----------------------------------------------------------------------------
-- 2. robots
-- -----------------------------------------------------------------------------
CREATE TABLE robots (
    robot_id            INTEGER PRIMARY KEY,
    site_id             INTEGER NOT NULL REFERENCES sites(site_id),
    model               TEXT    NOT NULL CHECK (model IN ('PA-1', 'PA-2')),                     -- fictional model names
    deployment_date     TEXT    NOT NULL,
    status              TEXT    NOT NULL CHECK (status IN ('operational', 'maintenance', 'offline')),
    autonomy_score      REAL    NOT NULL CHECK (autonomy_score >= 0.0 AND autonomy_score <= 1.0), -- 30-day rolling average
    last_incident_date  TEXT
);

-- -----------------------------------------------------------------------------
-- 3. shifts
-- -----------------------------------------------------------------------------
CREATE TABLE shifts (
    shift_id         INTEGER PRIMARY KEY,
    date             TEXT    NOT NULL,
    site_id          INTEGER NOT NULL REFERENCES sites(site_id),
    shift_type       TEXT    NOT NULL CHECK (shift_type IN ('4am', 'morning', 'afternoon', 'on-call', 'remote-monitoring')),
    team_member      TEXT    NOT NULL,
    duration_hours   REAL    NOT NULL CHECK (duration_hours > 0)
);

-- -----------------------------------------------------------------------------
-- 4. incidents (technical issues; customer concerns live in their own table)
-- -----------------------------------------------------------------------------
CREATE TABLE incidents (
    incident_id                  INTEGER PRIMARY KEY,
    date                         TEXT    NOT NULL,
    site_id                      INTEGER NOT NULL REFERENCES sites(site_id),
    robot_id                     INTEGER NOT NULL REFERENCES robots(robot_id),
    category                     TEXT    NOT NULL CHECK (category IN ('hardware', 'software', 'network', 'safety')),
    severity                     TEXT    NOT NULL CHECK (severity IN ('critical', 'major', 'minor')),
    required_human_intervention  INTEGER NOT NULL CHECK (required_human_intervention IN (0, 1)),
    resolved_remotely            INTEGER NOT NULL CHECK (resolved_remotely IN (0, 1)),
    resolution_time_minutes      INTEGER,
    status                       TEXT    NOT NULL CHECK (status IN ('open', 'resolved'))
);

-- -----------------------------------------------------------------------------
-- 5. customer_concerns (raised by humans, different semantics from incidents)
-- -----------------------------------------------------------------------------
CREATE TABLE customer_concerns (
    concern_id      INTEGER PRIMARY KEY,
    site_id         INTEGER NOT NULL REFERENCES sites(site_id),
    raised_date     TEXT    NOT NULL,
    raised_by       TEXT    NOT NULL CHECK (raised_by IN ('store_manager', 'duty_manager', 'head_office', 'shop_floor_staff')),
    description     TEXT    NOT NULL,
    severity        TEXT    NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
    status          TEXT    NOT NULL CHECK (status IN ('open', 'resolved')),
    resolved_date   TEXT
);

-- -----------------------------------------------------------------------------
-- 6. phase_transitions (timeline of phase moves per site)
-- -----------------------------------------------------------------------------
CREATE TABLE phase_transitions (
    transition_id           INTEGER PRIMARY KEY,
    site_id                 INTEGER NOT NULL REFERENCES sites(site_id),
    from_phase              INTEGER          CHECK (from_phase IN (1, 2, 3, 4)),                -- NULL for initial deployment
    to_phase                INTEGER NOT NULL CHECK (to_phase IN (1, 2, 3, 4)),
    transition_date         TEXT    NOT NULL,
    days_in_previous_phase  INTEGER                                                              -- NULL for initial deployment
);

-- -----------------------------------------------------------------------------
-- 7. phase_blockers (what's stopping each non-Phase-4 site from progressing)
-- -----------------------------------------------------------------------------
CREATE TABLE phase_blockers (
    blocker_id               INTEGER PRIMARY KEY,
    site_id                  INTEGER NOT NULL REFERENCES sites(site_id),
    blocker_description      TEXT    NOT NULL,
    target_metric            TEXT    NOT NULL,                                                  -- e.g. "autonomy_score" / "days_in_current_phase" / "remote_resolution_rate"
    current_value            TEXT    NOT NULL,
    required_value           TEXT    NOT NULL,
    estimated_resolution_date TEXT,
    created_date             TEXT    NOT NULL
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX idx_robots_site_id              ON robots(site_id);
CREATE INDEX idx_shifts_site_id              ON shifts(site_id);
CREATE INDEX idx_shifts_date                 ON shifts(date);
CREATE INDEX idx_incidents_site_id           ON incidents(site_id);
CREATE INDEX idx_incidents_date              ON incidents(date);
CREATE INDEX idx_incidents_robot_id          ON incidents(robot_id);
CREATE INDEX idx_customer_concerns_site_id   ON customer_concerns(site_id);
CREATE INDEX idx_customer_concerns_status    ON customer_concerns(status);
CREATE INDEX idx_phase_transitions_site_id   ON phase_transitions(site_id);
CREATE INDEX idx_phase_blockers_site_id      ON phase_blockers(site_id);
