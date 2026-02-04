#!/bin/bash

# Declare image related variables
IMG_FROM=karagozemin/aegis-var-engine:1.0.0
IMG_TO=karagozemin/tee-scone-aegis-var-engine:1.0.0

# Run the sconifier to build the TEE image based on the non-TEE image
docker run --rm \
            -v $PWD/enclave-key.pem:/sig/enclave-key.pem \
            -v /var/run/docker.sock:/var/run/docker.sock \
            registry.scontain.com/scone-production/iexec-sconify-image:5.9.1-v16 \
            sconify_iexec \
            --scone-signer=/sig/enclave-key.pem \
            --from=${IMG_FROM} \
            --to=${IMG_TO} \
            --binary-fs \
            --fs-dir=/app \
            --host-path=/etc/hosts \
            --host-path=/etc/resolv.conf \
            --binary=/usr/local/bin/python3 \
            --heap=1G \
            --dlopen=1 \
            --verbose \
            && echo -e "\n------------------\n" \
            && echo "successfully built TEE docker image => ${IMG_TO}" \
            && echo "application mrenclave.fingerprint is $(docker run --rm -e SCONE_HASH=1 ${IMG_TO})"
