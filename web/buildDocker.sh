#!/bin/bash

podman build -t hello-flask:1.0.0 .
if [ $? -ne 0 ]; then
    echo "Build failed, trying with updated requirements..."
    # Here you can add logic to modify requirements.txt, for example:
    sed -i 's/==/>=/' requirements.txt
    podman build -t hello-flask:1.0.0 .
fi
