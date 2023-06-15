// these are needed so the colors are included in the build
// since we dynamically assign them they would normally get dropped
export function Util() {
  return (
    <>
      <div className="bg-dark_cyan"></div>
      <div className="bg-palatinate"></div>
      <div className="bg-caribbean_current"></div>
    </>
  );
}
