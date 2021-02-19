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

## Building / Releasing

1. Bump whatever you want to bump in the `package.json` version field
2. `npm run dist` and commit the built output (yes, you read that right)
3. create/update the major version and specific version tags: `git tag -f vMAJOR.MINOR.PATCH && git tag -f vMAJOR`
4. `git push && git push --force --tags`
