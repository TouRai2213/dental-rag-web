export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">
        Conversation {conversationId}
      </h1>
      <p className="text-muted-foreground">
        Individual conversation view will be implemented in Task #5
      </p>
    </div>
  )
}