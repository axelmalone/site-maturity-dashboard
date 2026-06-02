-- =============================================================================
-- Site Maturity Dashboard — Seed Data
-- =============================================================================
-- 10 sample UK supermarket sites across all 4 phases.
-- Reference date: 2026-06-02 (treated as "today" by app code).
--
-- Phase distribution:
--   Phase 1: 3 sites (sites 1-3, deployed last 30 days)
--   Phase 2: 3 sites (sites 4-6, deployed roughly 30-95 days ago)
--   Phase 3: 3 sites (sites 7-9, deployed 90-200 days ago)
--   Phase 4: 1 site  (site 10, deployed ~300 days ago)
--
-- Brand mix: 3 Tesco · 2 Sainsbury's · 2 Waitrose · 1 M&S · 1 Co-op · 1 Morrisons
-- =============================================================================

-- -----------------------------------------------------------------------------
-- sites (10 rows)
-- -----------------------------------------------------------------------------
INSERT INTO sites (site_id, customer_name, store_format, site_name, city, area, deployment_date, current_phase, operating_hours_per_day) VALUES
  ( 1, 'Tesco',       'Express',    'Tesco Express Hammersmith',        'London', 'Hammersmith',      '2026-05-13', 1, 18),
  ( 2, 'Sainsbury''s','Local',      'Sainsbury''s Local Camden Town',   'London', 'Camden Town',      '2026-05-20', 1, 16),
  ( 3, 'Co-op',       'Food',       'Co-op Notting Hill',                'London', 'Notting Hill',     '2026-05-25', 1, 18),
  ( 4, 'Waitrose',    'Food',       'Waitrose Marylebone',               'London', 'Marylebone',       '2026-04-04', 2, 14),
  ( 5, 'Tesco',       'Express',    'Tesco Express Clapham Junction',    'London', 'Clapham Junction', '2026-03-01', 2, 18),
  ( 6, 'M&S',         'Food',       'M&S Food Bayswater',                'London', 'Bayswater',        '2026-04-19', 2, 18),
  ( 7, 'Waitrose',    'Food',       'Waitrose Belsize Park',             'London', 'Belsize Park',     '2025-12-09', 3, 14),
  ( 8, 'Sainsbury''s','Central',    'Sainsbury''s Central Victoria',     'London', 'Victoria',         '2026-01-02', 3, 24),
  ( 9, 'Tesco',       'Metro',      'Tesco Metro Holborn',               'London', 'Holborn',          '2025-11-14', 3, 18),
  (10, 'Morrisons',   'Superstore', 'Morrisons Wandsworth',              'London', 'Wandsworth',       '2025-08-06', 4, 24);

-- -----------------------------------------------------------------------------
-- robots (13 rows — 7 sites with 1 robot, 3 sites with 2 robots)
-- -----------------------------------------------------------------------------
-- Older PA-1 model at older sites (deployed pre-2026); newer PA-2 at recent sites.
-- Autonomy generally correlates with site maturity (more time = better-tuned environment).
INSERT INTO robots (robot_id, site_id, model, deployment_date, status, autonomy_score, last_incident_date) VALUES
  ( 1,  1, 'PA-2', '2026-05-13', 'operational',  0.62, '2026-05-30'),
  ( 2,  2, 'PA-2', '2026-05-20', 'operational',  0.58, '2026-05-28'),
  ( 3,  3, 'PA-2', '2026-05-25', 'operational',  0.41, '2026-05-29'),
  ( 4,  4, 'PA-2', '2026-04-04', 'operational',  0.83, '2026-05-15'),
  ( 5,  5, 'PA-2', '2026-03-01', 'operational',  0.91, '2026-05-20'),
  ( 6,  6, 'PA-2', '2026-04-19', 'operational',  0.81, '2026-05-25'),
  ( 7,  7, 'PA-1', '2025-12-09', 'operational',  0.89, '2026-04-10'),
  ( 8,  7, 'PA-2', '2026-03-15', 'operational',  0.94, '2026-05-02'),
  ( 9,  8, 'PA-2', '2026-01-02', 'operational',  0.91, '2026-04-22'),
  (10,  9, 'PA-1', '2025-11-14', 'operational',  0.91, '2026-05-10'),
  (11,  9, 'PA-2', '2026-02-10', 'operational',  0.95, '2026-05-08'),
  (12, 10, 'PA-1', '2025-08-06', 'operational',  0.95, '2026-04-12'),
  (13, 10, 'PA-1', '2025-08-06', 'maintenance',  0.97, '2026-03-28');

-- -----------------------------------------------------------------------------
-- phase_transitions (22 rows — full history per site)
-- -----------------------------------------------------------------------------
INSERT INTO phase_transitions (transition_id, site_id, from_phase, to_phase, transition_date, days_in_previous_phase) VALUES
  -- Phase 1 sites: 1 row each (initial deployment)
  ( 1,  1, NULL, 1, '2026-05-13', NULL),
  ( 2,  2, NULL, 1, '2026-05-20', NULL),
  ( 3,  3, NULL, 1, '2026-05-25', NULL),
  -- Phase 2 sites: initial + P1→P2
  ( 4,  4, NULL, 1, '2026-04-04', NULL),
  ( 5,  4, 1,    2, '2026-05-09', 35),
  ( 6,  5, NULL, 1, '2026-03-01', NULL),
  ( 7,  5, 1,    2, '2026-04-01', 31),
  ( 8,  6, NULL, 1, '2026-04-19', NULL),
  ( 9,  6, 1,    2, '2026-05-22', 33),
  -- Phase 3 sites: initial + P1→P2 + P2→P3
  (10,  7, NULL, 1, '2025-12-09', NULL),
  (11,  7, 1,    2, '2026-01-13', 35),
  (12,  7, 2,    3, '2026-04-13', 90),
  (13,  8, NULL, 1, '2026-01-02', NULL),
  (14,  8, 1,    2, '2026-02-04', 33),
  (15,  8, 2,    3, '2026-04-16', 71),
  (16,  9, NULL, 1, '2025-11-14', NULL),
  (17,  9, 1,    2, '2025-12-18', 34),
  (18,  9, 2,    3, '2026-03-09', 82),
  -- Phase 4 site: initial + P1→P2 + P2→P3 + P3→P4
  (19, 10, NULL, 1, '2025-08-06', NULL),
  (20, 10, 1,    2, '2025-09-08', 33),
  (21, 10, 2,    3, '2025-12-01', 84),
  (22, 10, 3,    4, '2026-04-19', 139);

-- -----------------------------------------------------------------------------
-- phase_blockers (10 rows — what's stopping each non-Phase-4 site from progressing)
-- Site 5 (Clapham Junction) has cleared its blockers and is now eligible for Phase 3.
-- -----------------------------------------------------------------------------
INSERT INTO phase_blockers (blocker_id, site_id, blocker_description, target_metric, current_value, required_value, estimated_resolution_date, created_date) VALUES
  ( 1,  1, 'Autonomy below 0.80 threshold for Phase 2 entry',                    'autonomy_score',             '0.62', '0.80', '2026-06-20', '2026-05-13'),
  ( 2,  2, '30-day operating minimum not yet reached',                            'days_operating',             '13',   '30',   '2026-06-19', '2026-05-20'),
  ( 3,  3, '30-day operating minimum not yet reached',                            'days_operating',             '8',    '30',   '2026-06-24', '2026-05-25'),
  ( 4,  3, 'Autonomy below 0.80 threshold for Phase 2 entry',                    'autonomy_score',             '0.41', '0.80', '2026-07-15', '2026-05-25'),
  ( 5,  4, 'Remote resolution rate below 50% threshold for Phase 3 entry',       'remote_resolution_rate',     '0.40', '0.50', '2026-06-30', '2026-05-09'),
  ( 8,  6, 'Less than 60 days in Phase 2 (Phase 3 entry criterion)',             'days_in_current_phase',      '11',   '60',   '2026-07-21', '2026-05-22'),
  ( 9,  7, 'Autonomy below 0.95 threshold for Phase 4 entry',                    'autonomy_score',             '0.92', '0.95', '2026-07-15', '2026-04-13'),
  (10,  8, 'Less than 90 days in Phase 3 (Phase 4 entry criterion)',             'days_in_current_phase',      '47',   '90',   '2026-07-15', '2026-04-16'),
  (11,  8, 'Autonomy below 0.95 threshold for Phase 4 entry',                    'autonomy_score',             '0.91', '0.95', '2026-07-30', '2026-04-16'),
  (12,  9, 'Critical incident on 2026-05-10 within last 30 days (Phase 4 entry blocker)', 'critical_incidents_30_days', '1', '0', '2026-06-10', '2026-05-10');

-- -----------------------------------------------------------------------------
-- customer_concerns (15 rows)
-- -----------------------------------------------------------------------------
-- Weighted toward Phase 1-2 sites (new deployment friction).
-- All Phase 2+ concerns raised AFTER Phase 2 entry (no unresolved concerns at entry).
INSERT INTO customer_concerns (concern_id, site_id, raised_date, raised_by, description, severity, status, resolved_date) VALUES
  -- Site 1 (Phase 1)
  ( 1, 1, '2026-05-15', 'store_manager',     'Shelves blocked during morning restock period',                  'high',   'open',     NULL),
  ( 2, 1, '2026-05-22', 'duty_manager',      'Robot took too long traversing aisle 3 during peak hour',        'medium', 'resolved', '2026-05-26'),
  ( 3, 1, '2026-05-28', 'head_office',       'Aesthetic concern raised about visible cabling near entrance',   'low',    'open',     NULL),
  -- Site 2 (Phase 1)
  ( 4, 2, '2026-05-22', 'store_manager',     'Customer complaint about robot startling them in dairy aisle',   'high',   'open',     NULL),
  ( 5, 2, '2026-05-25', 'shop_floor_staff',  'Robot bumped a display, no damage but visible to customers',     'medium', 'resolved', '2026-05-28'),
  -- Site 3 (Phase 1) — newest, most issues
  ( 6, 3, '2026-05-26', 'store_manager',     'Robot interfered with peak-hour shopping flow Sunday lunchtime', 'high',   'open',     NULL),
  ( 7, 3, '2026-05-28', 'duty_manager',      'Multiple customer queries about robot purpose, staff unprepared','high',   'open',     NULL),
  ( 8, 3, '2026-05-30', 'store_manager',     'Robot path crosses high-traffic zone near checkouts',            'medium', 'open',     NULL),
  -- Site 4 (Phase 2) — raised after Phase 2 entry on 2026-05-09
  ( 9, 4, '2026-05-20', 'duty_manager',      'Restocking timing clash with morning delivery window',           'medium', 'resolved', '2026-05-27'),
  -- Site 5 (Phase 2) — raised after Phase 2 entry on 2026-04-16
  (10, 5, '2026-05-18', 'store_manager',     'Cosmetic issue — robot signage missing on side panel',           'low',    'resolved', '2026-05-25'),
  -- Site 6 (Phase 2) — raised after Phase 2 entry on 2026-05-22
  (11, 6, '2026-05-24', 'store_manager',     'Robot speed too cautious during quiet hours, blocking aisles',   'medium', 'resolved', '2026-05-29'),
  (12, 6, '2026-05-30', 'duty_manager',      'Cleaning crew concerns about robot during overnight cleaning',   'low',    'open',     NULL),
  -- Site 7 (Phase 3) — raised after Phase 3 entry on 2026-04-13
  (13, 7, '2026-04-28', 'head_office',       'Customer query about data privacy of robot cameras',             'medium', 'resolved', '2026-05-08'),
  -- Site 8 (Phase 3) — raised after Phase 3 entry on 2026-04-16
  (14, 8, '2026-04-17', 'head_office',       'Branded livery question from regional store manager',            'low',    'resolved', '2026-05-02'),
  -- Site 9 (Phase 3) — raised after Phase 3 entry on 2026-03-09
  (15, 9, '2026-05-12', 'duty_manager',      'Robot caused minor stocking delay during overnight refurb works','high',   'resolved', '2026-05-20');

-- -----------------------------------------------------------------------------
-- incidents (26 rows — technical issues only, customer concerns are separate)
-- -----------------------------------------------------------------------------
-- Distribution: more incidents at earlier-phase sites (less validated environments).
-- Phase 3+ sites should show high remote-resolution rate (≥50%) — already met for them.
-- Site 9 has the critical incident within last 30 days (blocks Phase 4).
INSERT INTO incidents (incident_id, date, site_id, robot_id, category, severity, required_human_intervention, resolved_remotely, resolution_time_minutes, status) VALUES
  -- Site 1 (Phase 1, R1)
  ( 1, '2026-05-18',  1,  1, 'hardware', 'minor',    1, 0,  25, 'resolved'),
  ( 2, '2026-05-25',  1,  1, 'software', 'major',    1, 0,  45, 'resolved'),
  ( 3, '2026-05-30',  1,  1, 'software', 'minor',    0, 1,  12, 'resolved'),
  -- Site 2 (Phase 1, R2)
  ( 4, '2026-05-22',  2,  2, 'software', 'minor',    1, 0,  18, 'resolved'),
  ( 5, '2026-05-26',  2,  2, 'hardware', 'major',    1, 0,  60, 'resolved'),
  ( 6, '2026-05-28',  2,  2, 'network',  'minor',    0, 1,   8, 'resolved'),
  -- Site 3 (Phase 1, R3) — newest, more incidents
  ( 7, '2026-05-26',  3,  3, 'software', 'major',    1, 0,  55, 'resolved'),
  ( 8, '2026-05-27',  3,  3, 'hardware', 'minor',    1, 0,  30, 'resolved'),
  ( 9, '2026-05-28',  3,  3, 'safety',   'major',    1, 0,  90, 'resolved'),
  (10, '2026-05-29',  3,  3, 'software', 'minor',    0, 1,   5, 'resolved'),
  -- Site 4 (Phase 2, R4)
  (11, '2026-05-10',  4,  4, 'network',  'minor',    0, 1,  15, 'resolved'),
  (12, '2026-05-15',  4,  4, 'hardware', 'minor',    1, 0,  22, 'resolved'),
  -- Site 5 (Phase 2, R5)
  (13, '2026-05-08',  5,  5, 'software', 'minor',    0, 1,  10, 'resolved'),
  (14, '2026-05-20',  5,  5, 'network',  'minor',    0, 1,  12, 'resolved'),
  -- Site 6 (Phase 2, R6)
  (15, '2026-05-18',  6,  6, 'hardware', 'minor',    1, 0,  20, 'resolved'),
  (16, '2026-05-25',  6,  6, 'software', 'minor',    0, 1,   8, 'resolved'),
  -- Site 7 (Phase 3, R7+R8) — high remote resolution
  (17, '2026-04-10',  7,  7, 'hardware', 'minor',    0, 1,  18, 'resolved'),
  (18, '2026-04-28',  7,  8, 'software', 'minor',    0, 1,  12, 'resolved'),
  (19, '2026-05-02',  7,  8, 'software', 'minor',    0, 1,  10, 'resolved'),
  -- Site 8 (Phase 3, R9)
  (20, '2026-04-15',  8,  9, 'network',  'minor',    0, 1,   8, 'resolved'),
  (21, '2026-04-22',  8,  9, 'software', 'minor',    0, 1,  14, 'resolved'),
  -- Site 9 (Phase 3, R10+R11) — has the CRITICAL incident blocking Phase 4
  (22, '2026-04-20',  9, 10, 'hardware', 'minor',    0, 1,  25, 'resolved'),
  (23, '2026-05-08',  9, 11, 'network',  'minor',    0, 1,   6, 'resolved'),
  (24, '2026-05-10',  9, 10, 'software', 'critical', 1, 0, 120, 'resolved'),
  -- Site 10 (Phase 4, R12+R13) — old, well-resolved, all remote
  (25, '2026-04-12', 10, 12, 'hardware', 'minor',    0, 1,  12, 'resolved'),
  (26, '2026-03-28', 10, 13, 'software', 'minor',    0, 1,   9, 'resolved');

-- -----------------------------------------------------------------------------
-- shifts (30 rows — representative sample of last 4 days, all shift_types)
-- -----------------------------------------------------------------------------
-- Phase 1 sites: daily 4am + morning/afternoon (full support)
-- Phase 2 sites: on-call 4am rotation (David Okonkwo covers all 3) + reduced daytime
-- Phase 3 sites: remote-monitoring mostly + occasional in-person
-- Phase 4 site: weekly check-ins only
INSERT INTO shifts (shift_id, date, site_id, shift_type, team_member, duration_hours) VALUES
  -- Site 1 (Phase 1) — daily 4am + morning support
  ( 1, '2026-05-30', 1, '4am',                'Marcus Chen',      5.0),
  ( 2, '2026-05-31', 1, '4am',                'Priya Patel',      5.0),
  ( 3, '2026-06-01', 1, '4am',                'James O''Brien',   5.0),
  ( 4, '2026-06-02', 1, '4am',                'Marcus Chen',      5.0),
  ( 5, '2026-06-01', 1, 'morning',            'Sofia Martinez',   4.0),
  ( 6, '2026-06-02', 1, 'morning',            'David Okonkwo',    4.0),
  -- Site 2 (Phase 1) — daily 4am
  ( 7, '2026-05-31', 2, '4am',                'Sofia Martinez',   5.0),
  ( 8, '2026-06-01', 2, '4am',                'David Okonkwo',    5.0),
  ( 9, '2026-06-02', 2, '4am',                'Hannah Wright',    5.0),
  -- Site 3 (Phase 1) — daily 4am + afternoon support (newest, most coverage)
  (10, '2026-05-30', 3, '4am',                'James O''Brien',   5.0),
  (11, '2026-05-31', 3, '4am',                'Marcus Chen',      5.0),
  (12, '2026-06-01', 3, '4am',                'Priya Patel',      5.0),
  (13, '2026-06-02', 3, '4am',                'Sofia Martinez',   5.0),
  (14, '2026-06-01', 3, 'afternoon',          'Hannah Wright',    5.0),
  (15, '2026-06-02', 3, 'afternoon',          'Marcus Chen',      5.0),
  -- Site 4 (Phase 2) — on-call 4am + morning
  (16, '2026-05-30', 4, 'on-call',            'David Okonkwo',    2.0),
  (17, '2026-06-01', 4, 'morning',            'Hannah Wright',    4.0),
  -- Site 5 (Phase 2) — on-call 4am + morning (David covers all 3 P2 sites)
  (18, '2026-05-31', 5, 'on-call',            'David Okonkwo',    1.5),
  (19, '2026-06-02', 5, 'morning',            'Marcus Chen',      4.0),
  -- Site 6 (Phase 2) — on-call 4am + afternoon
  (20, '2026-06-01', 6, 'on-call',            'David Okonkwo',    2.0),
  (21, '2026-06-02', 6, 'afternoon',          'Priya Patel',      5.0),
  -- Site 7 (Phase 3) — remote-monitoring
  (22, '2026-05-31', 7, 'remote-monitoring',  'Hannah Wright',    3.0),
  (23, '2026-06-01', 7, 'remote-monitoring',  'Sofia Martinez',   2.0),
  (24, '2026-06-02', 7, 'remote-monitoring',  'Hannah Wright',    3.0),
  -- Site 8 (Phase 3) — remote-monitoring
  (25, '2026-05-30', 8, 'remote-monitoring',  'James O''Brien',   2.0),
  (26, '2026-06-02', 8, 'remote-monitoring',  'Sofia Martinez',   3.0),
  -- Site 9 (Phase 3) — remote-monitoring + in-person for critical incident response
  (27, '2026-05-30', 9, 'morning',            'Marcus Chen',      4.0),  -- in-person critical incident response
  (28, '2026-06-01', 9, 'remote-monitoring',  'Hannah Wright',    2.0),
  -- Site 10 (Phase 4) — weekly check-ins only
  (29, '2026-05-26', 10, 'morning',           'James O''Brien',   3.0),
  (30, '2026-06-02', 10, 'morning',           'Sofia Martinez',   3.0);

-- =============================================================================
-- Seed complete.
--   sites:                10
--   robots:               13
--   shifts:               30
--   incidents:            26
--   customer_concerns:    15
--   phase_transitions:    22
--   phase_blockers:       10
--   TOTAL ROWS:          126
-- =============================================================================
