// define our worker
const workerLogic = () => {
  self.onmessage = e => {
    const src = e.data;
    const sender = self;

    const onLoad = () => {
      sender.postMessage({success: true});
    };

    const onError = err => {
      sender.postMessage({success: false, error: err.message});
    };

    try {
      fetch(src, {mode: 'no-cors'})
        .then(onLoad)
        .catch(onError);
    } catch (err) {
      onError(err);
    }
  };
};

let code = workerLogic.toString();
code = code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'));

const blob = new Blob([code], {type: 'application/javascript'});
const workScript = URL.createObjectURL(blob);

// load image normally
const loadImageInApp = (src, onLoad, onError) => {
  const image = new Image();
  image.onload = onLoad;
  image.onerror = onError;

  image.src = src;
};

// load image in worker
const loadImageInWork = (src, onLoad, onError) => {
  try {
    const worker = new Worker(workScript);
    worker.onmessage = m => {
      if (m.data.success) {
        onLoad();
      } else if (onError) {
        // give image a chance
        loadImageInApp(src, onLoad, onError);
      }
    };
    worker.postMessage(src);
  } catch (err) {
    // this is likely due to this browser or user not supporting webworkers,
    // so try the normal one
    loadImageInApp(src, onLoad, onError);
  }
};

export default (src, onLoad, onError) => {
  // images can't be loaded on http from a web worker on https
  if (src.startsWith('http://')) {
    loadImageInApp(src, onLoad, onError);
    return;
  }

  loadImageInWork(src, onLoad, onError);
};
