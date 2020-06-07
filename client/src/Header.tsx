import { Button, Navbar, Spinner } from "@blueprintjs/core";
import React from "react";
import { Link, NavLink } from "react-router-dom";

interface HeaderProps {
  requestNewData(): void;
  isLoading: boolean;
}

export class Header extends React.PureComponent<HeaderProps> {
  render() {
    return (
      <Navbar style={{ marginBottom: 10 }}>
        <Navbar.Group>
          <Link to="/" className="bp3-button bp3-minimal  header-link">
            <Navbar.Heading style={{ display: "flex", alignItems: "center" }}>
              <img src="favicon-32x32.png" />
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
          <NavLink
            to="/month"
            className="bp3-button bp3-minimal  header-link"
            activeClassName="bp3-active bp3-intent-primary"
          >
            month
          </NavLink>
        </Navbar.Group>

        <Navbar.Group align="right">
          {this.props.isLoading && <Spinner size={32} />}
          {!this.props.isLoading && (
            <Button
              intent="primary"
              onClick={() => this.props.requestNewData()}
              icon="refresh"
              minimal={true}
            />
          )}
        </Navbar.Group>
      </Navbar>
    );
  }
}
