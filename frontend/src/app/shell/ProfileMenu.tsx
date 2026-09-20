// The signed-in human: an initials chip in the topbar, and the account menu
// behind it.
//
// Laid out the way account menus are across the industry: who you are, which
// workspace you are in, then the things you can do, with Sign out last and on
// its own. Identity and workspace are plain content; only rows that DO
// something are menu items. They used to be one class, .pop-item, so the email,
// the organisation and the role hovered and pointed like buttons and did
// nothing, and the one real action was indistinguishable from them.
//
// Keyboard follows the WAI-ARIA menu-button pattern: opening moves focus to the
// first item; ArrowUp/ArrowDown/Home/End move; Escape closes and returns focus
// to the chip; Tab closes and lets focus carry on.
//
// A session stored before full_name/email existed shows the org initials and no
// email row; it heals on the next token refresh.

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { menuKeyDown, Pill } from "@ds/primitives";
import { ChangePasswordDialog } from "@features/identity/change-password";
import { useAuth, useSession } from "@shared/auth";
import { WORKSPACE, type Theme } from "./Shell";

const THEMES: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return words
    .slice(0, 2)
    .map((w) => w[0]!)
    .join("");
}

export function ProfileMenu({ theme, onTheme }: { theme: Theme; onTheme: (t: Theme) => void }) {
  const session = useSession();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const nameId = useId();

  const items = () =>
    Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"],[role="menuitemradio"]') ?? [],
    );

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (hostRef.current && !hostRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Focus goes INTO the menu when it opens, or a keyboard user opens it and is
  // left on the chip with no way to reach what appeared.
  useEffect(() => {
    if (open) items()[0]?.focus();
  }, [open]);

  const closeAndRefocus = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) =>
    menuKeyDown(e, menuRef.current, (refocus) => (refocus ? closeAndRefocus() : setOpen(false)));

  const name = session.full_name || session.org_name;
  const workspace = WORKSPACE[session.role] ?? session.role;

  return (
    <div className="hostrel" ref={hostRef}>
      <button
        ref={buttonRef}
        type="button"
        className="avatarbtn"
        aria-label={`Account menu for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        {initials(name)}
      </button>

      {open && (
        <div className="pop acct" onKeyDown={onKeyDown}>
          <div className="acct-id">
            <span className="acct-av" aria-hidden="true">{initials(name)}</span>
            <div className="acct-who">
              <div className="acct-name" id={nameId}>{name}</div>
              {session.email && <div className="acct-email">{session.email}</div>}
            </div>
          </div>

          <div className="acct-ctx">
            <span className="acct-org" title={session.org_name}>{session.org_name}</span>
            <Pill>{workspace}</Pill>
          </div>

          <div className="acct-menu" role="menu" id={menuId} aria-labelledby={nameId} ref={menuRef}>
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              className="acct-item"
              onClick={() => {
                // Refocus the chip BEFORE the dialog mounts: Dialog restores
                // focus to whatever was focused when it opened, and the menu
                // item is about to unmount.
                closeAndRefocus();
                setChangingPassword(true);
              }}
            >
              Change password
            </button>
            <Link to="/privacy" role="menuitem" tabIndex={-1} className="acct-item" onClick={() => setOpen(false)}>
              Privacy notice
            </Link>

            <div className="acct-sep" role="separator" />

            <div className="acct-theme" role="group" aria-label="Theme">
              <span className="acct-label" aria-hidden="true">Theme</span>
              <div className="acct-seg">
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={theme === t.value}
                    tabIndex={-1}
                    // stays open: choosing a theme is a preview you may want to change
                    onClick={() => onTheme(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="acct-sep" role="separator" />

            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              className="acct-item"
              onClick={() => {
                setOpen(false);
                void logout().then(() => navigate("/login"));
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {changingPassword && <ChangePasswordDialog onClose={() => setChangingPassword(false)} />}
    </div>
  );
}
