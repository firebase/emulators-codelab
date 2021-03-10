# Internal Scripts

These scripts are used for codelab authors. If you are here to follow the codelab, you can ignore this folder.

## Setup

### claat

Install the `claat` tool from this repo:
https://github.com/googlecodelabs/tools

```
go get github.com/googlecodelabs/tools/claat
```

### node

In the scripts folder, install dependencies:

```
npm install
```

## Run

In the script folder, run `npm run devserver`

```
$ npm run devserver

> scripts@1.0.0 devserver /.../emulators-codelab/scripts
> node devserver.js

Serving content from /.../emulators-codelab/steps/firebase-emulator at http://localhost:3000
Detected file change (/.../emulators-codelab/steps/index.lab.md), recompiling...
```

Each time you make a change to `steps/index.lab.md` the devserver will automatically recompile the codelab,
so you only need to refresh your browser.
