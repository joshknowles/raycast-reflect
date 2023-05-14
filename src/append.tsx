import { appendToDailyNote, getGraphs, Graph, ReflectApiError } from "./helpers/api";
import { authorize } from "./helpers/oauth";

import { Action, ActionPanel, closeMainWindow, Form, popToRoot, showToast, Toast } from "@raycast/api";
import { FormValidation, useForm } from "@raycast/utils";
import { useEffect, useState } from "react";

interface FormValues {
  parentList: string;
  note: string;
  graphId: string;
}

export default function Command() {
  const { handleSubmit, itemProps } = useForm<FormValues>({
    async onSubmit(values: FormValues) {
      const toast = await showToast({
        style: Toast.Style.Animated,
        title: "Appending to Reflect Daily Note...",
      });

      try {
        const authorizationToken = await authorize();
        await appendToDailyNote(authorizationToken, values.graphId, values.note, values.parentList);

        toast.hide();
        popToRoot();
        closeMainWindow();
      } catch (error) {
        if (error instanceof ReflectApiError) {
          toast.style = Toast.Style.Failure;
          toast.title = error.message;
        }
      }
    },

    validation: {
      note: FormValidation.Required,
      graphId: FormValidation.Required,
    },
  });

  const [graphs, setGraphs] = useState<Graph[]>([]);

  useEffect(() => {
    async function fetchData() {
      const authorizationToken = await authorize();
      const graphs = await getGraphs(authorizationToken);
      setGraphs(graphs);
    }

    fetchData();
  }, []);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea {...itemProps.note} title="Note" />
      <Form.TextField
        {...itemProps.parentList}
        title="Parent List (Optional)"
        placeholder="i.e. 🗓 Daily Log"
        storeValue={true}
      />
      <Form.Separator />
      <Form.Dropdown {...itemProps.graphId} title="Graph">
        {graphs.map((graph) => (
          <Form.Dropdown.Item key={graph.id} value={graph.id} title={graph.name} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
