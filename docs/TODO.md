# TODO

## Conversion to SolidJS

- [ ] Comment scrolling is busted -- just put an ID on them and scroll explicitly? -- does not work if virtual rendering is used though
- [x] Story DB does not persist to disk?
- [ ] Resolve all lingering reactivity issues
- [ ] Split the `useDataStore` into dedicated stores for each part of the app
- [ ] Sort out service worker and better integrate into vite
- [ ] Reimplement the virtual rendering for comments
- [ ] Get the Docker builds working again
- [ ] Deploy to server and verify all is working
- [ ] Resolve errors with Show HN and collapsing the title comment
- [ ] Consider deferring client rendering until all local state stuff is processed
- [ ] Figure out how to handle icons better (if desired)
