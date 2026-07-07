-- S3A-3: guest checkout — allow anon INSERT for pending_payment orders

create policy "orders_insert_guest"
  on commerce.orders for insert
  to anon, authenticated
  with check (
    status = 'pending_payment'
    and payment_status = 'pending'
    and customer_id is null
  );

grant insert on commerce.orders to anon;
