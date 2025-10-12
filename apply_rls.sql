-- Helper Functions
create or replace function public.current_user_role() returns text language sql security definer set search_path = public stable as $$ select coalesce((select role::text from public.users where id = auth.uid()), 'customer'); $$;
revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to anon, authenticated;

create or replace function public.is_super_admin() returns boolean language sql stable as $$ select public.current_user_role() = 'super_admin'; $$;
create or replace function public.is_admin() returns boolean language sql stable as $$ select public.current_user_role() = 'admin'; $$;
create or replace function public.is_staff() returns boolean language sql stable as $$ select public.current_user_role() in ('admin', 'super_admin'); $$;

-- Users
alter table public.users enable row level security;
drop policy if exists users_sel on public.users;
drop policy if exists users_ins on public.users;
drop policy if exists users_ins_service on public.users;
drop policy if exists users_upd on public.users;
drop policy if exists users_del on public.users;
create policy users_sel on public.users for select using (public.is_staff() or id = auth.uid());
create policy users_ins on public.users for insert with check (public.is_super_admin());
create policy users_ins_service on public.users for insert to service_role with check (true);
create policy users_upd on public.users for update using (public.is_staff() or id = auth.uid()) with check (public.is_staff() or id = auth.uid());
create policy users_del on public.users for delete using (public.is_super_admin());

-- Bulk Inventory (admin read-only)
alter table public.bulk_inventory enable row level security;
drop policy if exists bulkinv_super on public.bulk_inventory;
drop policy if exists bulkinv_admin_ro on public.bulk_inventory;
create policy bulkinv_super on public.bulk_inventory for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy bulkinv_admin_ro on public.bulk_inventory for select using (public.is_admin());

-- Purchase Records (admin read-only)
alter table public.purchase_records enable row level security;
drop policy if exists purch_super on public.purchase_records;
drop policy if exists purch_admin_ro on public.purchase_records;
create policy purch_super on public.purchase_records for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy purch_admin_ro on public.purchase_records for select using (public.is_admin());

-- Inventory Adjustments (admin read-only)
alter table public.inventory_adjustments enable row level security;
drop policy if exists adj_super on public.inventory_adjustments;
drop policy if exists adj_admin_ro on public.inventory_adjustments;
create policy adj_super on public.inventory_adjustments for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy adj_admin_ro on public.inventory_adjustments for select using (public.is_admin());

-- Payments (admin read-only)
alter table public.payments enable row level security;
drop policy if exists pay_super on public.payments;
drop policy if exists pay_admin_ro on public.payments;
create policy pay_super on public.payments for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy pay_admin_ro on public.payments for select using (public.is_admin());

-- Refunds (admin read-only)
alter table public.refunds enable row level security;
drop policy if exists ref_super on public.refunds;
drop policy if exists ref_admin_ro on public.refunds;
create policy ref_super on public.refunds for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy ref_admin_ro on public.refunds for select using (public.is_admin());

-- Products (staff full access, public read)
alter table public.products enable row level security;
drop policy if exists products_select on public.products;
drop policy if exists products_modify on public.products;
create policy products_select on public.products for select using (true);
create policy products_modify on public.products for all using (public.is_staff()) with check (public.is_staff());

-- Categories (staff full access, public read)
alter table public.categories enable row level security;
drop policy if exists categories_select on public.categories;
drop policy if exists categories_modify on public.categories;
create policy categories_select on public.categories for select using (true);
create policy categories_modify on public.categories for all using (public.is_staff()) with check (public.is_staff());

-- Stores (staff full access, public read)
alter table public.stores enable row level security;
drop policy if exists stores_select on public.stores;
drop policy if exists stores_modify on public.stores;
create policy stores_select on public.stores for select using (true);
create policy stores_modify on public.stores for all using (public.is_staff()) with check (public.is_staff());

-- Orders (staff full access)
alter table public.orders enable row level security;
drop policy if exists orders_staff_all on public.orders;
create policy orders_staff_all on public.orders for all using (public.is_staff()) with check (public.is_staff());

-- Coupons (staff full access, public read)
alter table public.coupons enable row level security;
drop policy if exists coupons_select on public.coupons;
drop policy if exists coupons_modify on public.coupons;
create policy coupons_select on public.coupons for select using (true);
create policy coupons_modify on public.coupons for all using (public.is_staff()) with check (public.is_staff());

-- Promotional Banners (staff full access, public read)
alter table public.promotional_banners enable row level security;
drop policy if exists banners_select on public.promotional_banners;
drop policy if exists banners_modify on public.promotional_banners;
create policy banners_select on public.promotional_banners for select using (true);
create policy banners_modify on public.promotional_banners for all using (public.is_staff()) with check (public.is_staff());

-- Support Tickets (staff full access)
alter table public.support_tickets enable row level security;
drop policy if exists tickets_staff_all on public.support_tickets;
create policy tickets_staff_all on public.support_tickets for all using (public.is_staff()) with check (public.is_staff());

-- Notifications (own only)
alter table public.notifications enable row level security;
drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
