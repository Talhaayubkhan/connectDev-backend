const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

const isRecentlyActive = (lastSeen, now = Date.now()) => {
  if (!lastSeen) return false;
  const seenAt = new Date(lastSeen).getTime();
  return Number.isFinite(seenAt) && now - seenAt <= ACTIVE_WINDOW_MS;
};

const serializeUser = (
  user,
  { includeEmail = false, now = Date.now() } = {},
) => {
  if (!user) return null;
  const source = typeof user.toObject === "function" ? user.toObject() : user;
  const identifier = source._id ?? source.id;
  const id = identifier?.toString();

  const serialized = {
    _id: id,
    id,
    firstName: source.firstName,
    lastName: source.lastName,
    photoURL: source.photoURL,
    age: source.age,
    gender: source.gender,
    about: source.about,
    skills: source.skills,
    location: source.location,
    occupation: source.occupation,
    isActive: isRecentlyActive(source.lastSeen, now),
    lastSeen: source.lastSeen,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };

  if (includeEmail) serialized.email = source.email;
  return serialized;
};

module.exports = { isRecentlyActive, serializeUser };
