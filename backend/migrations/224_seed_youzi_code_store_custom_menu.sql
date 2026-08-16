-- Add the Youzi redemption-code storefront as a user-visible custom page.
--
-- The external storefront is embedded without forwarding Sub2API user identity
-- or the login JWT. The migration is idempotent and preserves all existing
-- custom menu items.

DO $$
DECLARE
    v_raw      text;
    v_items    jsonb;
    v_new_item jsonb;
BEGIN
    SELECT value INTO v_raw
      FROM settings WHERE key = 'custom_menu_items';

    IF COALESCE(TRIM(v_raw), '') = '' OR TRIM(v_raw) = 'null' THEN
        v_items := '[]'::jsonb;
    ELSE
        BEGIN
            v_items := v_raw::jsonb;
        EXCEPTION WHEN others THEN
            RAISE NOTICE '[migration-224] custom_menu_items is invalid JSON; storefront item was not added';
            RETURN;
        END;
    END IF;

    IF jsonb_typeof(v_items) IS DISTINCT FROM 'array' THEN
        RAISE NOTICE '[migration-224] custom_menu_items is not an array; storefront item was not added';
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
          FROM jsonb_array_elements(v_items) elem
         WHERE elem ->> 'id' = 'youziai-code-store'
            OR elem ->> 'url' = 'https://catfk.com/shop/youziai'
    ) THEN
        RETURN;
    END IF;

    v_new_item := jsonb_build_object(
        'id',         'youziai-code-store',
        'label',      '卡网充值',
        'icon_svg',   '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10.5h18M5.25 10.5l.75 9h12l.75-9M4.5 10.5 6.75 4.5h10.5l2.25 6M9 14.25h6"/></svg>',
        'url',        'https://catfk.com/shop/youziai',
        'auth_mode',  'none',
        'visibility', 'user',
        'sort_order', jsonb_array_length(v_items)
    );

    v_items := v_items || jsonb_build_array(v_new_item);

    INSERT INTO settings (key, value)
    VALUES ('custom_menu_items', v_items::text)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

    RAISE NOTICE '[migration-224] Added Youzi redemption-code storefront custom menu item';
END $$;
