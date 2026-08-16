package migrations

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestMigration224SeedsYouziaiStoreWithoutForwardingLoginToken(t *testing.T) {
	content, err := FS.ReadFile("224_seed_youzi_code_store_custom_menu.sql")
	require.NoError(t, err)

	sql := string(content)
	require.Contains(t, sql, "https://catfk.com/shop/youziai")
	require.Contains(t, sql, "'id',         'youziai-code-store'")
	require.Contains(t, sql, "'label',      '卡网充值'")
	require.Contains(t, sql, "'auth_mode',  'none'")
	require.Contains(t, sql, "jsonb_array_elements(v_items)")
	require.Contains(t, sql, "ON CONFLICT (key) DO UPDATE")
	require.NotContains(t, sql, "'auth_mode',  'query'")
}
