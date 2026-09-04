// The signed-in human: an initials chip in the topbar, on every view.
//
// Same popover mechanics as the notification bell — .hostrel host, outside
// mousedown closes. A session stored before full_name/email existed shows the
// org initials and no email row; it heals on the next token refresh.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useSession } from "@shared/auth";
import { WORKSPACE } from "./Shell";

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return words
    .slice(0, 2)
    .map((w) => w[0]!)
    .join("");
}

export function ProfileMenu() {
  const session = useSession();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const name = session.full_name || session.org_name;

  return (
    <div className="hostrel" ref={ref}>
      <button
        type="button"
        className="avatarbtn"
        aria-label="Account"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {initials(name)}
      </button>
      {open && (
        <div className="pop" role="menu">
          <div className="pop-head">
            <b>{name}</b>
          </div>
          <div className="pop-list">
            {session.email && (
              <div className="pop-item">
                <span className="txt">{session.email}</span>
              </div>
            )}
            <div className="pop-item">
              <span className="txt">{session.org_name}</span>
            </div>
            <div className="pop-item">
              <span className="txt">{WORKSPACE[session.role] ?? session.role}</span>
            </div>
            <button
              type="button"
              className="pop-item"
              onClick={() => {
                setOpen(false);
                void logout().then(() => navigate("/login"));
              }}
            >
              <span className="txt">Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
