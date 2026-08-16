package dto

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestCustomMenuItemAuthModeRoundTrip(t *testing.T) {
	raw := `[{"id":"store","label":"Store","icon_svg":"","url":"https://example.com","auth_mode":"none","visibility":"user","sort_order":0}]`

	items := ParseCustomMenuItems(raw)
	require.Len(t, items, 1)
	require.Equal(t, "none", items[0].AuthMode)

	encoded, err := json.Marshal(items[0])
	require.NoError(t, err)
	require.Contains(t, string(encoded), `"auth_mode":"none"`)
}
