const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');

const SENTINEL_VERSION = '0.26.2';
const PLATFORM = os.platform();
const ARCH = os.arch();

const URL_MAP = {
    'win32': 'windows',
    'linux': 'linux',
    'darwin': 'darwin'
};

const ARCH_MAP = {
    'x64': 'amd64',
    'arm64': 'arm64'
};

const platformName = URL_MAP[PLATFORM];
const archName = ARCH_MAP[ARCH] || 'amd64';

if (!platformName) {
    console.error('Unsupported platform');
    process.exit(1);
}

const zipName = `sentinel_${SENTINEL_VERSION}_${platformName}_${archName}.zip`;
const downloadUrl = `https://releases.hashicorp.com/sentinel/${SENTINEL_VERSION}/${zipName}`;
const binDir = path.join(__dirname, '../bin');
const binName = PLATFORM === 'win32' ? 'sentinel.exe' : 'sentinel';
const binPath = path.join(binDir, binName);

if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
}

function runSentinel(executablePath) {
    console.log('Running Sentinel tests...');
    try {
        const cmd = `"${executablePath}" test -verbose policies/oci-governance-policies`;
        execSync(cmd, { stdio: 'inherit' });
    } catch (e) {
        process.exit(1);
    }
}

// Check if sentinel is installed globally
try {
    execSync('sentinel version', { stdio: 'ignore' });
    console.log('Using global sentinel');
    runSentinel('sentinel');
} catch (e) {
    if (fs.existsSync(binPath)) {
        console.log('Using local sentinel');
        runSentinel(binPath);
    } else {
        console.log('Downloading Sentinel...');
        const zipPath = path.join(binDir, zipName);
        const file = fs.createWriteStream(zipPath);
        https.get(downloadUrl, (response) => {
            if (response.statusCode !== 200) {
                console.error(`Failed to download Sentinel: ${response.statusCode}`);
                process.exit(1);
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    console.log('Extracting...');
                    try {
                        if (PLATFORM === 'win32') {
                             execSync(`powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${binDir}' -Force"`);
                        } else {
                             execSync(`unzip -o '${zipPath}' -d '${binDir}'`);
                             fs.chmodSync(binPath, '755');
                        }
                        fs.unlinkSync(zipPath);
                        runSentinel(binPath);
                    } catch (err) {
                        console.error('Extraction failed', err);
                        process.exit(1);
                    }
                });
            });
        });
    }
}
