export function getArgs() {
  return process.argv.reduce<Record<string, string | boolean>>((args, arg) => {
    // long arg
    if (arg.startsWith('--')) {
      const [flag, value] = arg.split('=');
      args[flag.slice(2)] = value ?? true;
    }
    // flags
    else if (arg[0] === '-') {
      const flags = arg.slice(1).split('');
      flags.forEach((flag) => {
        args[flag] = true;
      });
    }
    return args;
  }, {});
}
