-- Test: simular una compra de plan Launch para probar el flujo
-- Sin pasar por Paddle. Reemplazá el email por el tuyo.

-- 1. Buscar tu cuenta y waitlist
-- Cambiá este email por el que usaste para registrarte:
WITH mi_usuario AS (
  SELECT id FROM auth.users WHERE email = 'leovenezia@outlook.com.ar'
  LIMIT 1
),
mi_cuenta AS (
  SELECT a.id AS account_id, a.owner_id
  FROM accounts a, mi_usuario u
  WHERE a.owner_id = u.id
  LIMIT 1
),
mi_waitlist AS (
  SELECT w.id AS waitlist_id, w.account_id
  FROM waitlists w, mi_cuenta c
  WHERE w.account_id = c.account_id
  LIMIT 1
)
-- 2. Insertar un purchase simulado (plan Launch)
INSERT INTO purchases (account_id, waitlist_id, paddle_transaction_id, plan, amount, currency, status)
SELECT 
  account_id,
  waitlist_id,
  'test_transaction_launch',
  'launch',
  29.00,
  'USD',
  'completed'
FROM mi_waitlist;

-- 3. Actualizar la waitlist a plan Launch
UPDATE waitlists w
SET 
  plan = 'launch',
  submission_limit = 500
FROM mi_waitlist mw
WHERE w.id = mw.waitlist_id;

-- 4. Reactivar subscribers hidden que ahora entran en el nuevo límite
UPDATE subscribers s
SET status = 'active'
FROM mi_waitlist mw
WHERE s.waitlist_id = mw.waitlist_id
  AND s.status = 'hidden';

-- 5. Si hay más de 500 activos, ocultar los que excedan
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY referral_count DESC, created_at ASC) AS rn
  FROM subscribers
  WHERE waitlist_id = (SELECT waitlist_id FROM mi_waitlist)
    AND status = 'active'
)
UPDATE subscribers s
SET status = 'hidden'
FROM ranked r
WHERE s.id = r.id AND r.rn > 500;

-- Ver resultado
SELECT 'Hecho! La waitlist ahora es:' AS mensaje;
SELECT w.name, w.plan, w.submission_limit, w.slug
FROM waitlists w, mi_waitlist mw
WHERE w.id = mw.waitlist_id;
