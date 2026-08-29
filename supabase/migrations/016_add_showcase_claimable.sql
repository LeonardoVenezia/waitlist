-- Migration 016: Add `claimable` flag to showcases.
--
-- When `true`, the public product page shows the "Claim this product" button
-- so visitors can request ownership. Used for products that the admin
-- loaded manually to seed the directory — founders can then claim them.
-- Defaults to `false`: user-created products are never claimable.

alter table public.showcases
  add column if not exists claimable boolean not null default false;

-- Useful for the admin panel to find products that can be claimed.
create index if not exists idx_showcases_claimable
  on public.showcases(claimable)
  where claimable = true;
