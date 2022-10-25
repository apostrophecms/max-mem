#!/usr/bin/env node

import { spawn, execSync } from 'child_process';

const argv = process.argv.slice(2);

if (!argv[0]) {
  console.error(`Usage: max-mem <command>`);
  process.exit(1);
}

const processes = new Map();

go().then(() => {
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});

async function go() {
  let max = 0;
  const child = spawn(argv[0], argv.slice(1), {
    shell: true,
    stdio: 'inherit'
  });
  const pid = child.pid;

  child.on('close', (status) => {
    console.log(`Max memory usage: ${Math.ceil(max / 1024)}MB`);
    process.exit(status);
  });
  child.on('error', e => {
    // Spawn failed
    console.error(e);
    process.exit(1);
  });

  process.on('SIGINT', function() {
    child.kill('SIGINT');
  });
  process.on('SIGQUIT', function() {
    child.kill('SIGQUIT');
  });
  process.on('SIGTERM', function() {
    child.kill('SIGTERM');
  });

  while (true) {
    const output = execSync('ps -o pid,ppid,rss', { encoding: 'utf8' });
    const lines = output.split('\n');
    for (const line of lines) {
      const fields = line.trim().split(/\s+/);
      if (fields[0] === 'PID') {
        continue;
      }
      const childPid = parseInt(fields[0], 10);
      if (isNaN(childPid)) {
        continue;
      }
      const ppid = parseInt(fields[1], 10);
      processes.set(childPid, { ppid, rss: parseInt(fields[2], 10) });
    }
    for (const [ pid, info ] of processes.entries()) {
      const parent = processes.get(info.ppid);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(pid);
      }
    }
    for (const [ pid, info ] of processes.entries()) {
      recursiveRss(pid, info);
    }
    max = Math.max(max, processes.get(pid).recursiveRss);
    await sleep(100);
  }
}

function recursiveRss(pid, info) {
  if (info.recursiveRss !== undefined) {
    return info.recursiveRss;
  }
  if (info.children) {
    info.recursiveRss = info.rss + info.children.reduce((sum, childPid) => {
      return sum + recursiveRss(childPid, processes.get(childPid));
    }, 0);
  } else {
    info.recursiveRss = info.rss;
  }
  return info.recursiveRss;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
