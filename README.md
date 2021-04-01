<p align="center">
  <img src="docs/logo.png" width=512>
</p>

<p align="center">
  <img src="https://img.shields.io/github/release/githubocto/flat.svg">
  <img src="https://img.shields.io/github/release-date/githubocto/flat.svg">
</p>

# Flat

Flat is a GitHub action which makes it easy to fetch data and commit it to your repository as flatfiles. The action is intended to be run on a schedule, retrieving data from any supported target and creating a commit if there is any change to the fetched data.

Just as [materialized views](https://en.wikipedia.org/wiki/Materialized_view) make it easier and faster to work the results of a query, Flat makes it easy to materialize data from anywhere into your workspace.

✨ Best used in tandem with the [Flat VS Code Extension](https://github.com/githubocto/flat-vscode).

Flat streamlines a pattern popularized by [Simon Willison](https://simonwillison.net/2020/Oct/9/git-scraping/) and [Alex Gaynor](https://github.com/alex/nyt-2020-election-scraper). The pattern of pulling data into git is an interesting one that deserves a dead-simple developer experience. Flat is an experiment from [GitHub's Office of the CTO](https://octo.github.com) to make it easier for anyone to employ this pattern.

## Why would I want to use this?

Ultimately, Flat is about getting data into your repo with a minimum of fuss. These are some examples of what you can use it for, but this is by no means an exhaustive list.

- **Evergreen working sets of data, delivered to your repo.** Big data is not usable in its raw form. Most of the time, we need to filter and aggregate in order to prepare a bite we can chew. You can do it manually, or you can have flat do it for you.
- **Self-updating test fixtures**: How often have you shipped a bug to production because your tests' fixtures contained a snapshot of production data from seven months ago? That's definitely never happened to us. Ever.
- **Turn snapshots into histories**: sometimes, the data you want is only available as a snapshot of the current state of a system. Use Flat to capture snapshots over time. This is great for anything that must be audited; if you can make the state of a system queryable, you can have Flat capture a checksummed history of how things were. Blockchain without they hype!
- **A paved path between datastores and static webapps**: pull data into your webapp. New data triggers new deploys. You can ship an static app right from your repo with [GitHub Pages](https://pages.github.com). This has the nice property of bringing the data your thing needs into a GitOpsish workflow.

## Antipatterns

Git is remarkably flexible, but it is not a great tool for storing a lot of data, or for storing binary data. It can do these things, but it will make your repo bloated and slow, and you may run up against [GitHub's size limitations](https://docs.github.com/en/github/managing-large-files/what-is-my-disk-quota#file-and-repository-size-limitations).

There's a tradeoff to be made between overall data size and rate of data change. If you know that your data does not change very often, then you can probably tolerate a larger amount of data.

## Usage

### VS Code & Codespaces

The easiest way to get a Flat fetcher up and running is with the [flat-vscode extension](). There are two ways to do this:

1. Using VS Code on your desktop.
2. Creating a [GitHub Codespace](https://github.com/features/codespaces) in the repository you wish to fetch data into.

To use it, [install the extension]() and then invoke `flat` from the command palette (Mac: ⌘⇧P, Others:ctrl-shift-P).

### Manually in a GitHub Actions workflow

In the repository where you wish to fetch data, create `.github/workflows/flat.yml`. The following example will fetch a URL every thirty minutes and commit the response, but only if the response has changed since the last commit.

```yaml
name: Flat

on:
  push:
    branches:
      - main
  workflow_dispatch:
  schedule:
    - cron: '*/30 * * * *'

jobs:
  scheduled:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repo
        uses: actions/checkout@v2
      - name: Fetch data
        uses: githubocto/flat@v1
        with:
          http_url: # THE URL YOU WISH TO FETCH GOES HERE
```

Note that the `schedule` parameter affects the overall workflow, which may contain other jobs and steps beyond Flat.

The `schedule` parameter uses [crontab format](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#schedule). There's a [library of useful examples](https://crontab.guru/examples.html) and an interactive playground on [Crontab guru](https://crontab.guru).

## Inputs

The action currently has two fetching modes:

- `http`: GETs a supplied URL
- `sql`: Queries a SQL datastore

These two modes are exclusive; you cannot mix settings for these two in one Flat step for a workflow job.

### `outfile_basename`

This value is used as the basis for the file created to store data fetched by Flat. An extension is appended to this value at runtime to determine the actual filename. The behavior depends on Flat's fetching mode:

- `http`
  1. If the response headers contain a `content-disposition` header, determine an extension from that.
  2. Otherwise, attempt to infer an extension based on a `content-type` header, if available.
  3. Give up and use `outfile_basename` as the entire filename, without an extension.
- `sql`: the extension is determined on the basis of the `sql_format` input.

### `http_url`

A URL from which to fetch data. Specifying this input puts Flat into `http` mode.

### `sql_connstring`

A URI-style database connection string. Flat will use this connection string to connect to the database and issue the query.

> ⚠️ Don't write secrets into your workflow.yml!
>
> Most connection strings contain an authentication secret like a username and password. GitHub provides an encrypted vault for secrets like these which can be used by the action when it runs. [Create a secret](https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository) on the repository where the Flat action will run, and use that secret in your workflow.yaml like so:
>
> ```
> sql_connstring: ${{NAME_OF_THE_CREATED_SECRET}}
> ```
>
> If you're using the [flat-vscode extension](https://github.com/githubocto/flat-vscode), this is handled for you.

### `sql_format`

One of `csv` or `json`. SQL query results will be serialized to disk in the specified format. Defaults to `json`.

> ⚠️ While the JSON is not pretty-printed, CSV is often a more efficient serialization for tabular data.

### `sql_queryfile`

The name of the file containing the SQL query that will be issued to the database. Defaults to `query.sql`, which must be placed in `.github/workflows` alongside the `workflow.yml`.

## Outputs

### `delta_bytes`

A signed number describing the number of bytes that changed in this run. If the new data is smaller than the existing, committed data, this will be a negative number.

## Postprocessing

### `postprocess`

This is the path to a script that will be invoked to postprocess your data after it is fetched. More docs coming soon.

---

# Contributing

WIP!

## Building / Releasing

1. `npm run dist` and commit the built output (yes, you read that right)
2. Bump whatever you want to bump in the `package.json` version field
3. Merge `main` into `vMAJOR` branch. `git checkout vMAJOR && git merge main`

- If this is a new major version, create the branch. `git checkout -b vMAJOR`
- Push the branch. `git push --set-upstream origin vMAJOR`

4. Create a new tag for the version: `git tag -f vMAJOR.MINOR.PATCH`
5. Push main `git checkout main && git push`
6. Navigate to https://github.com/githubocto/flat/tags and cut a new release from the tag you just pushed!

## License

[MIT](LICENSE)
