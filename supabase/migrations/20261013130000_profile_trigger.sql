
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
      -- Stop the sign up if the email doesnt end in  unb.ca  
      if new.email not like '%unb.ca' THEN
        raise exception 'Access denied. Registration is restricted to @unb.ca email addresses.';
      end if;
      
      insert into public.profiles (user_id, email, display_name)
        VALUES(
        New.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'full_name' ) 

        ON CONFLICT (user_id) DO NOTHING;

  return NEW;
end;
$$;


CREATE OR REPLACE TRIGGER auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

