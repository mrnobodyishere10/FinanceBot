console.log("featureFlags config loaded");

const featureFlags = {
    newFeature: false, // Set to true to enable the new feature
    betaFeature: false, // Set to true to enable the beta feature
};

const isFeatureEnabled = (feature) => {
    return featureFlags[feature] === true;
};

module.exports = {
    featureFlags,
    isFeatureEnabled,
};