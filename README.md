<div align="center">

<img src="screenshot.png" alt="Termadoro, an orb of teal light, awake on the title screen of a terminal" width="720">

# Termadoro · test builds

**A focus timer for your terminal, kept by something very old.**

[See it on the web](https://bobbydotdesign.github.io/termadoro-releases/) · Thanks for helping test it.

</div>

## Install

For Apple Silicon Macs (M1 and newer).

**With [Homebrew](https://brew.sh):**

```sh
brew install bobbydotdesign/tap/termadoro
```

**Without Homebrew**, paste this into Terminal, then open a new terminal window:

```sh
curl -fsSL https://github.com/bobbydotdesign/termadoro-releases/releases/latest/download/install.sh | sh
```

That installer checks the download's checksum, puts a single file at
`~/.local/bin/termadoro`, and adds that folder to your `PATH` if it isn't there
yet. Want to read it first? It's [`install.sh`](install.sh).

Either way, you can run the install command from any folder. Then start it with:

```sh
termadoro
```

**For the best look**, use a terminal with 24-bit color: iTerm2, Ghostty,
WezTerm, kitty or the VS Code terminal. The built-in Terminal app works too, in
256 colors. **Turn your sound on**: Termadoro speaks, and has music for your
sessions.

## Where to run it

Anywhere. termadoro keeps everything in `~/.local/share/termadoro` and never
writes files into the folder you start it from, so it's safe to run inside your
project repos.

Starting it inside a git repo is actually handy: your sessions get tagged with
that project's name, so the high-score table (`h`) and `termadoro --stats` can
break your time down by project. Start it from your home folder, or pass
`-p ''`, to leave sessions untagged.

## What it is

Focus for 25 minutes on one thing, rest for 5, and after four rounds rest
longer. Termadoro is a being of light from between the seconds, and your focus
makes it stronger: each interval you keep returns one of its memories.

## Things to try

- **Meet it.** The intro plays the first time you launch (it asks your name); press `a` to see it again.
- **Do a quick round:** `termadoro -f 1 -s 1` gives you a one-minute focus and a one-minute rest.
- **Hear a memory.** Your first interval brings one back; press `enter` during the rest to hear it, or `l` any time.
- **Walk the path:** `h` shows how far you've come and which memories wait ahead.
- **Attune it:** `c` changes its form (an orb, a butterfly, a dragon, a jellyfish), its color and its music.
- **Press around:** `t` names your task, `b` touches the light, `?` shows everything else.
- **Use it for real.** A normal 25-minute session is the best test of all.

## What I'd love to hear

- Anything that looked broken, cut off or glitchy. A screenshot plus your terminal app and window size helps a lot.
- How the sound lands: Termadoro's voice, the music, the chimes.
- Anything confusing, or anything you wished it did.
- Would you keep using it?

Send it all straight to Bobby. Screenshots and screen recordings are very welcome.

## Update

With Homebrew: `brew upgrade termadoro`. Otherwise, run the install command again.

## Uninstall

With Homebrew: `brew uninstall termadoro`. Otherwise:

```sh
rm ~/.local/bin/termadoro
```

and delete the line the installer added to `~/.zshrc` (it's marked
`# Added by the termadoro installer`).

To also remove your history and settings:

```sh
rm -rf ~/.local/share/termadoro ~/.cache/termadoro
```

## Privacy

Everything stays on your computer: your session history, settings and scores.
termadoro makes no network requests and has no analytics.

## About this repository

It only holds test builds and the website. Termadoro's source code is private
while it's being tested. The app is [MIT licensed](LICENSE).
