export function Fallback(props: { label: string }) {
  console.log("*** Fallback", props.label);
  return <div class="relative pb-[70vh]" />;
}
