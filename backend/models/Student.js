const { createModel } = require('../lib/pgModel');
const Student = createModel('students');

Student.schema = {
  path: function(fieldName) {
    const requiredFields = [
      'fullName',
      'email',
      'college',
      'course',
      'branch',
      'academicYear',
      'passwordHash'
    ];
    return {
      isRequired: requiredFields.includes(fieldName),
      defaultValue: fieldName === 'role' ? 'STUDENT' : undefined
    };
  }
};

module.exports = Student;
