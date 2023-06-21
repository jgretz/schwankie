// these are needed so the colors are included in the build
// since we dynamically assign them they would normally get dropped
export function Util() {
  return (
    <>
      <div className="bg-accent_salmon"></div>
      <div className="bg-accent_tan"></div>
      <div className="bg-accent_blue"></div>
      <div className="bg-accent_dark_green"></div>
      <div className="bg-accent_light_green"></div>
    </>
  );
}
