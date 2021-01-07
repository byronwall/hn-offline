import { Button, Card, InputGroup, Popover, Position } from "@blueprintjs/core";
import React from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";

import { handleStringChange } from "./helpers";

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

  componentDidMount() {}

  componentDidUpdate(
    prevProps: SearchPopupProps,
    prevState: SearchPopupState
  ) {}

  render() {
    return (
      <div style={{ position: "relative" }}>
        <Popover
          position={Position.BOTTOM_LEFT}
          minimal
          isOpen={this.state.isOpen}
          onClose={() => this.setState({ isOpen: false })}
        >
          <Button
            icon="search"
            intent="primary"
            minimal
            onClick={() => this.setState({ isOpen: true })}
          />
          <Card
            style={{ position: "absolute", width: 250, top: -45, left: -200 }}
          >
            <div style={{ display: "flex" }}>
              <InputGroup
                value={this.state.searchTerm}
                onChange={handleStringChange((searchTerm) =>
                  this.setState({ searchTerm })
                )}
                onKeyDown={(ev) => {
                  if (ev.keyCode === 13) {
                    this.handleSearch();
                  }
                }}
                autoFocus
              />

              <Button
                icon="search"
                onClick={() => {
                  this.handleSearch();
                }}
              />
            </div>
          </Card>
        </Popover>
      </div>
    );
  }

  private handleSearch() {
    this.props.history.push("/search/" + this.state.searchTerm);

    this.setState({ isOpen: false });
  }
}

export const SearchPopup = withRouter(_SearchPopup);
