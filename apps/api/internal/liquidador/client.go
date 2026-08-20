package liquidador

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// defaultPageSize is also the server-side maximum: the endpoint silently
// clamps perPage to 100.
const defaultPageSize = 100

// Client calls nexulex's developer API to read liquidaciones case data.
// Authenticated with a per-account Developer API Key (Authorization: Bearer).
type Client struct {
	BaseURL    string
	APIKey     string
	HTTPClient *http.Client
}

// NewClient builds a Client. baseURL is typically https://api.nexulex.com.
func NewClient(baseURL, apiKey string) *Client {
	return &Client{
		BaseURL: strings.TrimRight(baseURL, "/"),
		APIKey:  apiKey,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// FetchPage fetches a single page of causas.
func (c *Client) FetchPage(ctx context.Context, page, pageSize int) ([]Causa, bool, error) {
	if pageSize <= 0 {
		pageSize = defaultPageSize
	}

	endpoint := c.BaseURL + "/api/developer-data/liquidaciones/causas"
	// The page-size parameter is "perPage"; anything else (pageSize, limit) is
	// ignored and the endpoint falls back to its own default of 50.
	query := url.Values{
		"page":    []string{strconv.Itoa(page)},
		"perPage": []string{strconv.Itoa(pageSize)},
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint+"?"+query.Encode(), nil)
	if err != nil {
		return nil, false, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	req.Header.Set("Accept", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, false, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, false, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, false, fmt.Errorf("nexulex API returned status %d: %s", resp.StatusCode, truncate(body, 500))
	}

	var page_ causasPageResponse
	if err := json.Unmarshal(body, &page_); err != nil {
		return nil, false, fmt.Errorf("decode response: %w", err)
	}

	// Second pass over the same body to keep each causa's untouched JSON for
	// the mirror's "raw" column (see Causa.Raw).
	var rawPage struct {
		Causas []json.RawMessage `json:"causas"`
	}
	if err := json.Unmarshal(body, &rawPage); err == nil && len(rawPage.Causas) == len(page_.Causas) {
		for i := range page_.Causas {
			page_.Causas[i].Raw = rawPage.Causas[i]
		}
	}

	hasMore := page_.PageCount > 0 && page_.Page < page_.PageCount
	return page_.Causas, hasMore, nil
}

// FetchAll pages through every causa available to this API key.
func (c *Client) FetchAll(ctx context.Context) ([]Causa, error) {
	var all []Causa
	page := 1
	for {
		items, hasMore, err := c.FetchPage(ctx, page, defaultPageSize)
		if err != nil {
			return nil, fmt.Errorf("fetch page %d: %w", page, err)
		}
		all = append(all, items...)
		if !hasMore || len(items) == 0 {
			break
		}
		page++
	}
	return all, nil
}

func truncate(b []byte, n int) string {
	s := string(b)
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}
