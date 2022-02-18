const STATUS = {
  INITIAL: 'INITIAL',
  LOADING: "LOADING",
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE'
}

function Particle (data = null) {
  this.setInitial(data)
}

Particle.prototype.set = function (status, data) {
  if (data !== undefined) {
    this.data = data;
  }

  this.status = status;

  return this;
}

Particle.prototype.setInitial = function (data) {
  return this.set(STATUS.INITIAL, data);
}

Particle.prototype.setLoading = function (data) {
  return this.set(STATUS.LOADING, data);
}

Particle.prototype.setSuccess = function (data) {
  return this.set(STATUS.SUCCESS, data);
}

Particle.prototype.setFailure = function (error) {
  return this.set(STATUS.FAILURE, error);
}

Particle.prototype.isInitial = function () {
  return this.status === STATUS.INITIAL;
}

Particle.prototype.isLoading = function () {
  return this.status === STATUS.LOADING;
}

Particle.prototype.isSuccess = function () {
  return this.status === STATUS.SUCCESS;
}

Particle.prototype.isError = function () {
  return this.status === STATUS.ERROR;
}

Particle.prototype.promised = function (promise, prepare) {
  this.setLoading();
  const particle = this;

  return promise
    .then(function (response) {
      particle.setSuccess(prepare instanceof Function ? prepare(response) : response);
      return particle;
    })
    .catch(function (error) {
      particle.setFailure(error);
      return particle;
    });
}

module.exports = {
  Particle
};
