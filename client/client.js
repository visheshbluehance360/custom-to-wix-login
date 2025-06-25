addEventListener('load', () => {
    import('https://fpjscdn.net/v3/kWzf14a8Fq6ZNAXRwLCw')
        .then(FingerprintJS =>
            FingerprintJS.load({
                apiKey: "kWzf14a8Fq6ZNAXRwLCw"
            })
        )
        .then(fp =>
            fp.get()
        )
        .then(fingerprint => {
            console.log('fp.get()', fingerprint);

            console.log("fingerprint.sealedResult", fingerprint.sealedResult);

            return fingerprint_backend(fingerprint.sealedResult)
                .then(response =>
                    console.log("Finished with status: ", response)
                )
                .catch(error =>
                    console.error('error while running fingerprint_backend func', error)
                );
        })
        .catch(err => console.error("Failed to complete Sealed Client Results flow with error: ", err));
});

function fingerprint_backend(sealedResult) {
    return fetch('http://127.0.0.1:3000/fingerprint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sealedResult })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            return response.json();
        });
}