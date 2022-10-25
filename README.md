# max-mem

## Purpose

Measures the maximum memory usage of any command. `max-mem` checks the memory usage of the command every 100 milliseconds and reports the peak "resident set size" of the command when it exits, including any child processes. This is helpful in tracking down the cause of out-of-memory errors in Webpack builds and other expensive operations.

`max-mem` does for memory what `time` does for execution time.

## Install

```
npm install -g max-mem
```

## Usage

```
max-mem npm run build

[Regular output appears here]

Max memory usage: 800MB
```

## Credits

`max-mem` was created to facilitate our work on [ApostropheCMS](https://apostrophecms.com).
