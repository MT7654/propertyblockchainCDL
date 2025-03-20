import React from "react";

function Header({ userGroup, setUserGroup, account, govOfficer, userGroupStyle }) {
  return (
    <div style={{ textAlign: "center", marginBottom: "30px" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
        <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="80" height="80" rx="10" ry="10" stroke="#cc0001" strokeWidth="5" fill="white" />
          <polygon points="50,20 20,50 35,50 35,75 65,75 65,50 80,50" fill="#cc0001" />
          <rect x="45" y="50" width="10" height="25" fill="white" />
        </svg>
        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#000" }}>
          Government Land System
        </h1>
      </div>
      <div style={userGroupStyle}>
        <label htmlFor="userGroup"><strong>User Group:</strong></label>
        <select
          id="userGroup"
          value={userGroup}
          onChange={(e) => setUserGroup(e.target.value)}
          style={{ padding: "8px", fontSize: "16px" }}
        >
          <option value="governmentOfficer">Government Officer</option>
          <option value="developer">Developer</option>
          <option value="bank">Bank</option>
        </select>
      </div>
      <div style={{ marginTop: "10px" }}>
        <strong>Connected Account:</strong>{" "}
        {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : "Not connected"}
        {govOfficer && account && govOfficer.toLowerCase() === account.toLowerCase() && (
          <span style={{ marginLeft: "10px", background: "#cc0001", color: "white", padding: "3px 8px", borderRadius: "4px", fontSize: "12px" }}>
            Government Officer
          </span>
        )}
      </div>
    </div>
  );
}

export default Header;
