const { withGradleProperties } = require('expo/config-plugins');

/**
 * Gives Gradle enough heap and Metaspace for release builds, and makes it stop on an
 * OutOfMemoryError. Without this, the Kotlin tasks run out of Metaspace and the stuck Gradle
 * daemon keeps `eas build --local` hanging until the CI job is cancelled.
 */
module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;

    const setGradleProperty = (key, value) => {
      const index = props.findIndex((p) => p.type === 'property' && p.key === key);
      if (index >= 0) {
        props[index].value = value;
      } else {
        props.push({ type: 'property', key, value });
      }
    };

    setGradleProperty(
      'org.gradle.jvmargs',
      '-Xmx3g -XX:MaxMetaspaceSize=2g -XX:+ExitOnOutOfMemoryError -Dfile.encoding=UTF-8',
    );
    // No daemon, so a crashed build can't leave a process behind that keeps the job alive.
    setGradleProperty('org.gradle.daemon', 'false');

    return config;
  });
};
