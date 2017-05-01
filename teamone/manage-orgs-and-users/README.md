# Managing Organizations and Users

This directory contains a simple JavaScript program that demonstrates how to create and manage users and organizations via the Team-One (Intellinote) API.

## Installing

1. Install [Node.js](https://nodejs.org/) (4.4 or later).
2. Run `npm install` from this directory.

## Generating Documentation

1. Run `npm run doc`.
2. Open `docs/manage-orgs-and-users.html` in your web browser.

## Running

1. Copy `config.json.template` to `config.json`.
2. Edit `config.json` to enter your `client_id` and `client_secret` values.
3. Run `npm run it`. Note that this will connect to the Intellinote production server and create an organization and several user accounts.
