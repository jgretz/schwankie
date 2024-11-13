export function Loading({display = false}: {display: boolean}) {
  if (!display) {
    return <div className="loader-container"></div>;
  }

  return (
    <div className="loader-container">
      <div className="lds-ellipsis">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}
