/*
  # Comprehensive RLS and Helper Functions (Corrected)

  This migration creates helper functions and RLS policies for all tables.
  Adjusted for actual table names in the database.
*/

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable as $$
  select coalesce((select role::text from public.users where id = auth.uid()), 'customer');
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to anon, authenticated;

create or replace function public.is_super_admin()
returns boolean
language sql
stable as $$
  select public.current_user_role() = 'super_admin';
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable as $$
  select public.current_user_role() = 'admin';
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable as $$
  select public.current_user_role() in ('admin', 'super_admin');
$$;

create or replace function public.is_delivery_agent()
returns boolean
language sql
stable as $$
  select public.current_user_role() = 'delivery_agent';
$$;

create or replace function public.is_customer()
returns boolean
language sql
stable as $$
  select public.current_user_role() = 'customer';
$$;

create or replace function public.is_order_owner(p_order uuid)
returns boolean
language sql
security definer
set search_path = public
stable as $$
  select exists (
    select 1 from public.orders o
    where o.id = p_order
    and o.customer_id = auth.uid()
  );
$$;

create or replace function public.is_order_agent(p_order uuid)
returns boolean
language sql
security definer
set search_path = public
stable as $$
  select exists (
    select 1 from public.orders o
    where o.id = p_order
    and o.delivery_agent_id = auth.uid()
  );
$$;

-- ============================================================================
-- USERS TABLE
-- ============================================================================

alter table public.users enable row level security;

drop policy if exists "Users can always read own profile" on public.users;
drop policy if exists "Admins can read all users" on public.users;
drop policy if exists "Delivery agents can read customers" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Admins can update all users" on public.users;
drop policy if exists "Admins can insert users" on public.users;
drop policy if exists "Service role can insert users" on public.users;
drop policy if exists "Super admins can delete users" on public.users;
drop policy if exists users_sel on public.users;
drop policy if exists users_ins on public.users;
drop policy if exists users_upd on public.users;
drop policy if exists users_del on public.users;
drop policy if exists users_ins_service on public.users;

create policy users_sel on public.users
for select using (public.is_staff() or id = auth.uid());

create policy users_ins on public.users
for insert with check (public.is_super_admin());

create policy users_ins_service on public.users
for insert to service_role with check (true);

create policy users_upd on public.users
for update using (public.is_staff() or id = auth.uid())
with check (public.is_staff() or id = auth.uid());

create policy users_del on public.users
for delete using (public.is_super_admin());

-- ============================================================================
-- RESTRICTED MODULES (ADMIN READ-ONLY)
-- ============================================================================

-- Bulk Inventory
alter table public.bulk_inventory enable row level security;
drop policy if exists bulkinv_super on public.bulk_inventory;
drop policy if exists bulkinv_admin_ro on public.bulk_inventory;
create policy bulkinv_super on public.bulk_inventory for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy bulkinv_admin_ro on public.bulk_inventory for select using (public.is_admin());

-- Purchase Records
alter table public.purchase_records enable row level security;
drop policy if exists purch_super on public.purchase_records;
drop policy if exists purch_admin_ro on public.purchase_records;
create policy purch_super on public.purchase_records for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy purch_admin_ro on public.purchase_records for select using (public.is_admin());

-- Inventory Adjustments
alter table public.inventory_adjustments enable row level security;
drop policy if exists adj_super on public.inventory_adjustments;
drop policy if exists adj_admin_ro on public.inventory_adjustments;
create policy adj_super on public.inventory_adjustments for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy adj_admin_ro on public.inventory_adjustments for select using (public.is_admin());

-- Payments
alter table public.payments enable row level security;
drop policy if exists pay_super on public.payments;
drop policy if exists pay_admin_ro on public.payments;
drop policy if exists pay_sel_customer on public.payments;
create policy pay_super on public.payments for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy pay_admin_ro on public.payments for select using (public.is_admin());
create policy pay_sel_customer on public.payments for select using (public.is_order_owner(order_id));

-- Refunds
alter table public.refunds enable row level security;
drop policy if exists ref_super on public.refunds;
drop policy if exists ref_admin_ro on public.refunds;
drop policy if exists ref_sel_customer on public.refunds;
create policy ref_super on public.refunds for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy ref_admin_ro on public.refunds for select using (public.is_admin());
create policy ref_sel_customer on public.refunds for select using (public.is_order_owner(order_id));

-- ============================================================================
-- STANDARD MODULES (STAFF FULL ACCESS)
-- ============================================================================

-- Products
alter table public.products enable row level security;
drop policy if exists products_select on public.products;
drop policy if exists products_modify on public.products;
create policy products_select on public.products for select using (true);
create policy products_modify on public.products for all using (public.is_staff()) with check (public.is_staff());

-- Product Variants
alter table public.product_variants enable row level security;
drop policy if exists variants_select on public.product_variants;
drop policy if exists variants_modify on public.product_variants;
create policy variants_select on public.product_variants for select using (true);
create policy variants_modify on public.product_variants for all using (public.is_staff()) with check (public.is_staff());

-- Categories
alter table public.categories enable row level security;
drop policy if exists categories_select on public.categories;
drop policy if exists categories_modify on public.categories;
create policy categories_select on public.categories for select using (true);
create policy categories_modify on public.categories for all using (public.is_staff()) with check (public.is_staff());

-- Stores
alter table public.stores enable row level security;
drop policy if exists stores_select on public.stores;
drop policy if exists stores_modify on public.stores;
create policy stores_select on public.stores for select using (true);
create policy stores_modify on public.stores for all using (public.is_staff()) with check (public.is_staff());

-- Store Inventory
alter table public.store_inventory enable row level security;
drop policy if exists inventory_select on public.store_inventory;
drop policy if exists inventory_modify on public.store_inventory;
create policy inventory_select on public.store_inventory for select using (public.is_staff());
create policy inventory_modify on public.store_inventory for all using (public.is_staff()) with check (public.is_staff());

-- Orders
alter table public.orders enable row level security;
drop policy if exists orders_staff_all on public.orders;
drop policy if exists orders_customer_own on public.orders;
drop policy if exists orders_agent_assigned on public.orders;
drop policy if exists orders_agent_update on public.orders;
create policy orders_staff_all on public.orders for all using (public.is_staff()) with check (public.is_staff());
create policy orders_customer_own on public.orders for select using (public.is_customer() and customer_id = auth.uid());
create policy orders_agent_assigned on public.orders for select using (public.is_delivery_agent() and delivery_agent_id = auth.uid());
create policy orders_agent_update on public.orders for update using (public.is_delivery_agent() and delivery_agent_id = auth.uid()) with check (public.is_delivery_agent() and delivery_agent_id = auth.uid());

-- Order Items
alter table public.order_items enable row level security;
drop policy if exists order_items_staff on public.order_items;
drop policy if exists order_items_customer on public.order_items;
create policy order_items_staff on public.order_items for all using (public.is_staff()) with check (public.is_staff());
create policy order_items_customer on public.order_items for select using (public.is_order_owner(order_id));

-- Coupons
alter table public.coupons enable row level security;
drop policy if exists coupons_select on public.coupons;
drop policy if exists coupons_modify on public.coupons;
create policy coupons_select on public.coupons for select using (true);
create policy coupons_modify on public.coupons for all using (public.is_staff()) with check (public.is_staff());

-- Promotional Banners
alter table public.promotional_banners enable row level security;
drop policy if exists banners_select on public.promotional_banners;
drop policy if exists banners_modify on public.promotional_banners;
create policy banners_select on public.promotional_banners for select using (true);
create policy banners_modify on public.promotional_banners for all using (public.is_staff()) with check (public.is_staff());

-- Support Tickets
alter table public.support_tickets enable row level security;
drop policy if exists tickets_staff_all on public.support_tickets;
drop policy if exists tickets_customer_own on public.support_tickets;
drop policy if exists tickets_customer_insert on public.support_tickets;
drop policy if exists tickets_customer_update on public.support_tickets;
create policy tickets_staff_all on public.support_tickets for all using (public.is_staff()) with check (public.is_staff());
create policy tickets_customer_own on public.support_tickets for select using (user_id = auth.uid());
create policy tickets_customer_insert on public.support_tickets for insert to authenticated with check (user_id = auth.uid());
create policy tickets_customer_update on public.support_tickets for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Ticket Messages
alter table public.ticket_messages enable row level security;
drop policy if exists messages_ticket_participants on public.ticket_messages;
drop policy if exists messages_insert on public.ticket_messages;
create policy messages_ticket_participants on public.ticket_messages for select using (
  exists (select 1 from public.support_tickets st where st.id = ticket_id and (st.user_id = auth.uid() or st.assigned_to = auth.uid() or public.is_staff()))
);
create policy messages_insert on public.ticket_messages for insert to authenticated with check (
  exists (select 1 from public.support_tickets st where st.id = ticket_id and (st.user_id = auth.uid() or st.assigned_to = auth.uid() or public.is_staff()))
);

-- Notifications
alter table public.notifications enable row level security;
drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Order Ratings
alter table public.order_ratings enable row level security;
drop policy if exists order_ratings_select on public.order_ratings;
drop policy if exists order_ratings_customer on public.order_ratings;
drop policy if exists order_ratings_staff on public.order_ratings;
create policy order_ratings_select on public.order_ratings for select using (true);
create policy order_ratings_customer on public.order_ratings for insert to authenticated with check (user_id = auth.uid());
create policy order_ratings_staff on public.order_ratings for all using (public.is_staff()) with check (public.is_staff());
