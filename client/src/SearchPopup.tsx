import { Button, Card, InputGroup, Popover, Position } from "@blueprintjs/core";
import React, { KeyboardEventHandler } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";

import { handleStringChange } from "./helpers";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface SearchPopupProps extends RouteComponentProps<{}> {}
interface SearchPopupState {
  searchTerm: string;
  isOpen: boolean;
}

class _SearchPopup extends React.Component<SearchPopupProps, SearchPopupState> {
  constructor(props: SearchPopupProps) {
    super(props);

    this.state = { searchTerm: "", isOpen: false };
  }

  private handleKeyDown: KeyboardEventHandler<HTMLInputElement> | undefined = (
    ev
  ) => {
    if (ev.keyCode === 13) {
      this.handleSearch();
    }
  };

  private handleSearchTermChange = handleStringChange((searchTerm) =>
    this.setState({ searchTerm })
  );

  private handleClose = () => this.setState({ isOpen: false });
  private handleOpen = () => this.setState({ isOpen: true });

  private handleSearch = () => {
    const { searchTerm } = this.state;
    const { history } = this.props;
    history.push("/search/" + searchTerm);

    this.setState({ isOpen: false });
  };

  render() {
    const { isOpen, searchTerm } = this.state;
    return (
      <div style={{ position: "relative" }}>
        <Popover
          position={Position.BOTTOM_LEFT}
          minimal
          isOpen={isOpen}
          onClose={this.handleClose}
        >
          <Button
            icon="search"
            intent="primary"
            minimal
            onClick={this.handleOpen}
          />
          <Card
            style={{ position: "absolute", width: 250, top: -45, left: -200 }}
          >
            <div style={{ display: "flex" }}>
              <InputGroup
                value={searchTerm}
                onChange={this.handleSearchTermChange}
                onKeyDown={this.handleKeyDown}
                autoFocus
              />

              <Button icon="search" onClick={this.handleSearch} />
            </div>
          </Card>
        </Popover>
      </div>
    );
  }
}

export const SearchPopup = withRouter(_SearchPopup);
