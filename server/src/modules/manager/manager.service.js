import ManagerAssignments from '../../models/ManagerAssignments.js';

export async function listAssignedProperties(managerId) {
  const assignments = await ManagerAssignments.find({ manager: managerId, status: 'active' })
    .populate('property', 'name address description status utilityRate contractPolicy')
    .sort({ assignedAt: -1 })
    .lean();

  return assignments
    .filter(assignment => assignment.property)
    .map(assignment => ({
      assignmentId: assignment._id,
      assignedAt: assignment.assignedAt,
      ...assignment.property,
    }));
}
