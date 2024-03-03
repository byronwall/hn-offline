import StoryListPage from "./[datatype]/page";

export default function Home() {
  return <StoryListPage
    params={{
      datatype: "topstories"
    }}
  />;
}
