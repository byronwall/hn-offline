import { Button, Navbar, Spinner } from "@blueprintjs/core";
import React from "react";
import { Link, NavLink } from "react-router-dom";

import { SearchPopup } from "./SearchPopup";

interface HeaderProps {
  requestNewData(): void;
  isLoading: boolean;

  searchTerm: string;
}

export class Header extends React.PureComponent<HeaderProps> {
  render() {
    const { searchTerm, isLoading, requestNewData } = this.props;

    return (
      <Navbar style={{ marginBottom: 10 }}>
        <Navbar.Group>
          <Link to="/" className="bp3-button bp3-minimal  header-link">
            <Navbar.Heading style={{ display: "flex", alignItems: "center" }}>
              <img src="/favicon-32x32.png" />
              <span style={{ marginLeft: 3, color: "#5C7080" }}>offline</span>
            </Navbar.Heading>
          </Link>

          <NavLink
            to="/day"
            className="bp3-button bp3-minimal  header-link"
            activeClassName="bp3-active bp3-intent-primary"
          >
            day
          </NavLink>
          <NavLink
            to="/week"
            className="bp3-button bp3-minimal  header-link"
            activeClassName="bp3-active bp3-intent-primary"
          >
            week
          </NavLink>

          {searchTerm !== "" && (
            <NavLink
              to={"/search/" + searchTerm}
              className="bp3-button bp3-minimal  header-link"
              activeClassName="bp3-active bp3-intent-primary"
            >
              {searchTerm}
            </NavLink>
          )}
        </Navbar.Group>

        <Navbar.Group align="right">
          {isLoading && <Spinner size={32} intent="warning" />}
          {!isLoading && (
            <Button
              intent="primary"
              onClick={requestNewData}
              icon="refresh"
              minimal={true}
            />
          )}

          <SearchPopup />
        </Navbar.Group>
      </Navbar>
    );
  }
}
