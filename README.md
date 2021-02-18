# flat-action

The GitHub action which powers data fetching for [Flat](https://github.com/githubocto/flat).

## Inputs  

### `url`

A URL from which to fetch data, in CSV or JSON form

## Example

```yaml
uses: githubocto/flat-action@v1
with:
  url: "https://some.where/path/to/data.json"
```
