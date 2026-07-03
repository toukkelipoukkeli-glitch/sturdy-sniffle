interface ParsedCadMetadataFileName {
  extension: string
  normalizedFileName: string
  stemSegments: string[]
}

export function cadMetadataFileMatches(metadataFileName: string, attachmentFileName: string): boolean {
  const metadataFile = parseCadMetadataFileName(metadataFileName)
  const attachmentFile = parseCadMetadataFileName(attachmentFileName)
  if (metadataFile.normalizedFileName === attachmentFile.normalizedFileName) {
    return true
  }

  return (
    metadataFile.extension === attachmentFile.extension &&
    metadataFile.stemSegments.length === attachmentFile.stemSegments.length &&
    metadataFile.stemSegments.every((segment, index) => segment === attachmentFile.stemSegments[index])
  )
}

export function cadMetadataFileBelongsToPart(fileName: string, partNumber: string): boolean {
  const file = parseCadMetadataFileName(fileName)
  const part = parseCadMetadataFileName(partNumber)
  if (part.stemSegments.length === 0 || file.stemSegments.length < part.stemSegments.length) {
    return false
  }

  return file.stemSegments.some((_, startIndex) =>
    part.stemSegments.every((segment, offset) => file.stemSegments[startIndex + offset] === segment),
  )
}

function parseCadMetadataFileName(value: string): ParsedCadMetadataFileName {
  const normalizedFileName = value.trim().toLowerCase()
  const extensionStart = normalizedFileName.lastIndexOf(".")
  const stem = extensionStart > 0 ? normalizedFileName.slice(0, extensionStart) : normalizedFileName
  const extension = extensionStart > 0 ? normalizedFileName.slice(extensionStart + 1) : ""

  return {
    extension,
    normalizedFileName,
    stemSegments: stem.split(/[^a-z0-9]+/).filter(Boolean),
  }
}
