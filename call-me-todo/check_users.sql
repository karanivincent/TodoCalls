SELECT id, email, phone, created_at FROM auth.users WHERE phone = '+254704985136' OR raw_user_meta_data->>'phone' = '+254704985136';
