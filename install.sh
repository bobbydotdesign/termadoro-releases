#!/bin/sh
# termadoro installer: downloads the latest test build and puts it on your PATH.
#
#   curl -fsSL https://github.com/bobbydotdesign/termadoro-releases/releases/latest/download/install.sh | sh
#
# Options (environment variables):
#   TERMADORO_INSTALL_DIR   where to put the binary (default: ~/.local/bin)
#   TERMADORO_NO_MODIFY_PATH=1   don't add the install dir to your shell profile
set -eu

REPO="bobbydotdesign/termadoro-releases"
DIR="${TERMADORO_INSTALL_DIR:-$HOME/.local/bin}"

say() { printf '%s\n' "$*"; }
# Show paths under your home folder as ~/…
tilde() { case "$1" in "$HOME"/*) printf '~%s' "${1#"$HOME"}" ;; *) printf '%s' "$1" ;; esac; }
fail() { printf 'termadoro install: %s\n' "$*" >&2; exit 1; }

case "$(uname -s)-$(uname -m)" in
  Darwin-arm64) target="aarch64-apple-darwin" ;;
  *) fail "this test build is for Apple Silicon Macs only (you have $(uname -s) $(uname -m))." ;;
esac

command -v curl >/dev/null || fail "curl is required"
url="https://github.com/$REPO/releases/latest/download/termadoro-$target.tar.gz"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

say "Downloading Termadoro…"
curl -fsSL "$url" -o "$tmp/termadoro.tar.gz" || fail "download failed: $url"
curl -fsSL "$url.sha256" -o "$tmp/termadoro.tar.gz.sha256" || fail "checksum download failed"
want="$(cut -d ' ' -f 1 "$tmp/termadoro.tar.gz.sha256")"
have="$(shasum -a 256 "$tmp/termadoro.tar.gz" | cut -d ' ' -f 1)"
[ "$want" = "$have" ] || fail "checksum mismatch; please try again"

tar -xzf "$tmp/termadoro.tar.gz" -C "$tmp"
mkdir -p "$DIR"
install -m 755 "$tmp/termadoro" "$DIR/termadoro"
# Files fetched with curl aren't quarantined, but clear the flag just in case.
xattr -d com.apple.quarantine "$DIR/termadoro" 2>/dev/null || true

version="$("$DIR/termadoro" --version 2>/dev/null || echo termadoro)"
say "✓ Installed $version to $(tilde "$DIR/termadoro")"

case ":$PATH:" in
  *":$DIR:"*) say "Run it with: termadoro" ;;
  *)
    profile="$HOME/.zshrc"
    case "${SHELL:-}" in */bash) profile="$HOME/.bash_profile" ;; esac
    # Write "$HOME/…" rather than the expanded path, the way it's usually written.
    case "$DIR" in
      "$HOME"/*) shown="\$HOME${DIR#"$HOME"}" ;;
      *) shown="$DIR" ;;
    esac
    line="export PATH=\"$shown:\$PATH\""
    if [ "${TERMADORO_NO_MODIFY_PATH:-}" = "1" ]; then
      say "Add $(tilde "$DIR") to your PATH, or run it with: $(tilde "$DIR/termadoro")"
    elif grep -qsF "$line" "$profile"; then
      say "Open a new terminal window, then run: termadoro"
    else
      printf '\n# Added by the termadoro installer\n%s\n' "$line" >> "$profile"
      say "Added $(tilde "$DIR") to your PATH in $(tilde "$profile")."
      say "Open a new terminal window, then run: termadoro"
    fi
    ;;
esac
