#!/bin/bash


# sudo screen /dev/ttyUSB0 115200
# configure_edison --wifi


# Configure (fill these out)
AWS_KEY=""
AWS_SECRET=""
AWS_REGION="us-east-1"
SSL_COUNTRY="US"
SSL_STATE=""
SSL_CITY=""
SSL_ORG=""
SSL_HOST="edison"


# Install Python
echo "src intel-iotdk http://iotdk.intel.com/repos/3.0/intelgalactic/opkg/i586" > /etc/opkg/intel-iotdk.conf
echo "src/gz all http://repo.opkg.net/edison/repo/all
src/gz edison http://repo.opkg.net/edison/repo/edison
src/gz core2-32 http://repo.opkg.net/edison/repo/core2-32" > /etc/opkg/base-feeds.conf
opkg update
pip install --upgrade pip


# Install AWS utilities
pip install awscli


# Install AWS credentials for CLI
#aws configure
mkdir /home/root/.aws
echo "[default]
aws_access_key_id=$AWS_KEY
aws_secret_access_key=$AWS_SECRET" > /home/root/.aws/credentials
echo "[default]
region=$AWS_REGION
output=json" > /home/root/.aws/config


# Install git and utilities repository
cd ~
opkg install git
git clone https://github.com/10xNation/intel-edison-aws-iot-smart-home.git


# Create a certificate folder
cd ~
mkdir cert
cd cert


# Create a private key and certificate request
cd ~/cert
openssl genrsa -out edison_demo_key.pem 2048
openssl req -new -subj "/C=$SSL_COUNTRY/ST=$SSL_STATE/L=$SSL_CITY/O=$SSL_ORG/CN=$SSL_HOST" -key edison_demo_key.pem -out edison_demo.csr


# Issue and format certificate
cd ~/cert
aws iot create-certificate-from-csr --certificate-signing-request file://edison_demo.csr --set-as-active > cert_output.txt
CERT_ID=$(sed -n -e 's/.*"certificateId": "\(.*\)"/\1/p' cert_output.txt)
aws iot describe-certificate --certificate-id $CERT_ID --output text --query certificateDescription.certificatePem > edison_demo_crt.pem


# Download root certificate
cd ~/cert
curl https://www.symantec.com/content/en/us/enterprise/verisign/roots/VeriSign-Class%203-Public-Primary-Certification-Authority-G5.pem > root_ca.pem


# Install application requirements
cd ~/intel-edison-aws-iot-smart-home
npm init -y
npm install --save aws-iot-device-sdk


# Run the application
cd ~/intel-edison-aws-iot-smart-home
#node index.js
